// chat-api.ts
// Utilidad para manejar la conexión WebSocket y cifrado E2EE

import { useEffect, useRef, useState, useCallback } from "react"
import { encryptMessage, decryptMessage, isCryptoSupported, generateRoomKey } from "./crypto"

// Detectar automáticamente la URL del backend basada en el entorno
const getBackendUrl = () => {
  if (typeof window === "undefined") {
    // Server-side rendering
    return { 
      ws: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws", 
      api: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000" 
    }
  }
  
  // Usar variables de entorno en producción
  if (process.env.NEXT_PUBLIC_WS_URL && process.env.NEXT_PUBLIC_API_URL) {
    return {
      ws: process.env.NEXT_PUBLIC_WS_URL,
      api: process.env.NEXT_PUBLIC_API_URL
    }
  }
  
  // Fallback para desarrollo local
  const hostname = window.location.hostname
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1"
  
  if (isLocalhost) {
    return {
      ws: "ws://localhost:8000/ws",
      api: "http://localhost:8000"
    }
  } else {
    // Usar la misma IP que el frontend pero puerto 8000 para el backend
    return {
      ws: `ws://${hostname}:8000/ws`,
      api: `http://${hostname}:8000`
    }
  }
}

const { ws: WS_URL, api: API_URL } = getBackendUrl()

export interface ChatUser {
  id: string
  username: string
  color: string
  connected_at: string
  message_count?: number
}

export interface ChatMessage {
  id: string
  type: "chat_message" | "system_message" | "room_message"
  message: string
  username?: string
  timestamp: string
  color?: string
  user_id?: string
  room_id?: string
  reactions?: Record<string, number>
  encrypted?: any
}

export interface RoomInfo {
  room_id: string
  created_at: string
  user_count: number
  users: ChatUser[]
}

export function useChatApi() {
  const ws = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [users, setUsers] = useState<ChatUser[]>([])
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const lastTypingSent = useRef<number>(0)
  
  // Estados para cifrado E2EE
  const [roomKey, setRoomKey] = useState<string | null>(null)
  const roomKeyRef = useRef<string | null>(null) // Ref para evitar race conditions
  const [cryptoSupported, setCryptoSupported] = useState(false)
  
  // Limpieza total al cargar (evitar persistencia)
  useEffect(() => {
    // Limpiar cualquier dato persistente
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem('chat-messages')
        localStorage.removeItem('chat-user')
        localStorage.removeItem('chat-room-key')
        sessionStorage.removeItem('chat-messages')
        sessionStorage.removeItem('chat-user')
        sessionStorage.removeItem('chat-room-key')
      } catch (e) {
        // Silencioso - no mostrar errores de limpieza en consola
      }
    }

    // Limpiar todo antes de cerrar/recargar la página
    const handleBeforeUnload = () => {
      try {
        localStorage.removeItem('chat-messages')
        localStorage.removeItem('chat-user')
        localStorage.removeItem('chat-room-key')
        sessionStorage.clear()
      } catch (e) {
        // Silencioso - no mostrar errores de limpieza en consola
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener('beforeunload', handleBeforeUnload)
      window.addEventListener('pagehide', handleBeforeUnload)
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          handleBeforeUnload()
        }
      })
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        window.removeEventListener('pagehide', handleBeforeUnload)
        window.removeEventListener('visibilitychange', handleBeforeUnload)
      }
    }
  }, [])

  // Limpieza adicional cada 20 segundos para mayor agresividad
  useEffect(() => {
    const aggressiveCleanup = setInterval(() => {
      if (typeof window !== "undefined") {
        try {
          // Limpiar cualquier dato que pudiera haberse almacenado
          localStorage.removeItem('chat-messages')
          localStorage.removeItem('chat-user')
          localStorage.removeItem('chat-room-key')
        } catch (e) {
          // Silencioso - no mostrar errores de limpieza en consola
        }
      }
    }, 20000) // Cada 20 segundos

    return () => clearInterval(aggressiveCleanup)
  }, [])
  
  // Verificar soporte de cifrado al montar
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Realizar múltiples verificaciones para asegurar compatibilidad
      const initialCheck = isCryptoSupported()
      
      // Verificación adicional después de un breve delay para contextos que tardan en cargarse
      setTimeout(() => {
        const delayedCheck = isCryptoSupported()
        const finalSupported = initialCheck || delayedCheck
        
        setCryptoSupported(finalSupported)
        
        if (!finalSupported) {
          // Silencioso - no mostrar avisos de cifrado en consola
        }
      }, 100) // 100ms delay para permitir que el contexto se estabilice
    }
  }, [])

  // Monitorear cambios en estados de cifrado (silencioso)
  useEffect(() => {
    // Silencioso - no mostrar logs de estado en consola
  }, [cryptoSupported, roomKey])
  
  // Manejar usuarios escribiendo
  const handleTypingStatus = useCallback((data: any) => {
    if (data.isTyping) {
      setTypingUsers(prev => {
        if (!prev.includes(data.username)) {
          return [...prev, data.username]
        }
        return prev
      })
      
      // Remover después de 3 segundos
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(user => user !== data.username))
      }, 3000)
    } else {
      setTypingUsers(prev => prev.filter(user => user !== data.username))
    }
  }, [])

  // Manejar mensajes cifrados recibidos
  const handleEncryptedMessage = useCallback(async (data: any) => {
    const currentRoomKey = roomKeyRef.current // Usar ref para evitar stale closures
    
    try {
      if (!currentRoomKey) {
        setMessages((prev) => [...prev, {
          ...data,
          message: "[Esperando clave de cifrado...]",
          type: "system_message"
        }])
        return
      }

      if (!data.encrypted || !data.encrypted.data || !data.encrypted.iv) {
        setMessages((prev) => [...prev, {
          ...data,
          message: "[Datos de cifrado corruptos]",
          type: "system_message"
        }])
        return
      }

      const decryptedMessage = await decryptMessage(
        data.encrypted.data, 
        data.encrypted.iv, 
        currentRoomKey
      )
      
      // Crear mensaje descifrado
      const decryptedData = {
        ...data,
        message: decryptedMessage,
        type: "chat_message" // Cambiar tipo después de descifrar
      }
      
      // Remover datos cifrados
      delete decryptedData.encrypted
      
      setMessages((prev) => [...prev, decryptedData])
      
      // Mensaje descifrado correctamente (procesamiento silencioso)
      
    } catch (error) {
      // Error al descifrar mensaje (procesamiento silencioso)
      setMessages((prev) => [...prev, {
        ...data,
        message: "[Error al descifrar - clave incorrecta o datos corruptos]",
        type: "system_message"
      }])
    }
  }, [cryptoSupported, roomKey])

  // --- WebSocket connection ---
  useEffect(() => {
    setMounted(true)
    
    if (typeof window === "undefined") return
    
    const connectWebSocket = () => {
      ws.current = new WebSocket(WS_URL)
      
      ws.current.onopen = () => {
        setConnected(true)
      }
      
      ws.current.onclose = () => {
        setConnected(false)
      }
      
      ws.current.onerror = (error) => {
        setConnected(false)
      }
      
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          switch (data.type) {
            case "welcome":
              setCurrentUser(data.user_info)
              break
            case "chat_message":
            case "room_message":
              // Verificar si el mensaje tiene datos cifrados
              if (data.encrypted && (data.encrypted.data || data.encrypted.iv)) {
                handleEncryptedMessage(data)
              } else {
                setMessages((prev) => [...prev, data])
              }
              break
            case "system_message":
              setMessages((prev) => [...prev, data])
              break
            case "chat_message_encrypted":
              // Manejar mensaje cifrado (por compatibilidad)
              handleEncryptedMessage(data)
              break
            case "user_list":
              setUsers(data.users || [])
              break
            case "message_history":
              setMessages(data.messages || [])
              break
            case "room_key_share":
              // Recibir clave de sala para cifrado
              if (data.room_key) {
                const cryptoAvailableNow = isCryptoSupported()
                if (cryptoAvailableNow) {
                  setRoomKey(data.room_key)
                  roomKeyRef.current = data.room_key // Actualizar ref inmediatamente
                  // Removed console log
                  
                  // Actualizar estado si no coincide
                  if (!cryptoSupported) {
                    setCryptoSupported(true)
                    // Removed console log
                  }
                } else {
                  // Removed console log
                }
              }
              break
            case "public_key_response":
              // Clave para chat público
              if (data.public_key) {

                // Siempre aceptar la clave - usaremos cifrado real o fallback según disponibilidad
                setRoomKey(data.public_key)
                roomKeyRef.current = data.public_key // Actualizar ref inmediatamente
                
                // Actualizar estado de cifrado si Web Crypto está disponible
                const cryptoAvailableNow = isCryptoSupported()
                if (cryptoAvailableNow && !cryptoSupported) {
                  setCryptoSupported(true)
                  // Removed console log")
                } else if (!cryptoAvailableNow) {
                  // Removed console log")
                }
              } else {
                // Removed console log
              }
              break
            case "ping":
              // Heartbeat del servidor - no necesita acción
              // Removed console log
              break
            case "typing":
              setTypingUsers(data.users || [])
              break
            case "typing_status":
              // Manejar estado de typing individual
              handleTypingStatus(data)
              break
            case "reaction_update":
              // Actualizar reacciones en los mensajes
              setMessages(prev => prev.map(msg => {
                if (msg.id === data.messageId) {
                  const updatedReactions = { ...msg.reactions }
                  if (!updatedReactions[data.emoji]) {
                    updatedReactions[data.emoji] = 0
                  }
                  updatedReactions[data.emoji] += 1
                  return { ...msg, reactions: updatedReactions }
                }
                return msg
              }))
              break
            case "public_key_response":
              // Manejar respuesta de clave pública para E2EE
              // Removed console log
              break
            default:
              // Removed console log
              break
          }
        } catch (error) {
          // Removed console log
        }
      }
    }
    
    connectWebSocket()
    
    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [])

  // --- Send message ---
  const sendMessage = useCallback(async (msg: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        // Intentar cifrado (real o fallback) si tenemos clave
        if (roomKey) {
          // Removed console log
          try {
            const { encryptedData, iv } = await encryptMessage(msg, roomKey)
            
            // Enviar como chat_message con campos encrypted (backend espera este formato)
            const encryptedPayload = { 
              type: "chat_message", 
              message: "", // Mensaje vacío cuando está cifrado
              encrypted: {
                data: encryptedData,
                iv: iv
              }
            }
            
            ws.current.send(JSON.stringify(encryptedPayload))
            
            const encryptionType = cryptoSupported ? "AES-256-GCM" : "XOR+Base64 (fallback)"
            // Mensaje enviado cifrado (silencioso)
          } catch (encryptError) {
            // Error al cifrar mensaje (silencioso)
            ws.current.send(JSON.stringify({ type: "chat_message", message: msg }))
          }
        } else {
          // Enviar en texto plano con información del motivo
          const reason = !cryptoSupported ? "Cifrado no disponible" : "Sin clave de cifrado"

          ws.current.send(JSON.stringify({ type: "chat_message", message: msg }))
        }
      } catch (error) {
        // Removed console log
        // Fallback a texto plano en caso de error
        // Removed console log
        ws.current.send(JSON.stringify({ type: "chat_message", message: msg }))
      }
    } else {
      // Removed console log
    }
  }, [cryptoSupported, roomKey])

  // --- Send reaction ---
  const sendReaction = useCallback((messageId: string, emoji: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ 
        type: "reaction", 
        messageId: messageId,
        emoji: emoji,
        room: "general"
      }))
    }
  }, [])

  // --- Remove message (for auto-deletion) ---
  const removeMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }, [])

  // --- Typing indicator ---
  const sendTyping = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ 
        type: "typing", 
        isTyping: true,
        room: "general" 
      }))
    }
  }, [])

  // --- Throttled typing ---
  const sendTypingThrottled = useCallback(() => {
    const now = Date.now()
    if (now - lastTypingSent.current > 1000) {
      sendTyping()
      lastTypingSent.current = now
    }
  }, [sendTyping])

  // --- Room management (REST) ---
  const createRoom = useCallback(async () => {
    try {
      const { ws: _ws, api: API_URL } = getBackendUrl()
      const res = await fetch(`${API_URL}/rooms/create`, { method: "POST" })
      if (!res.ok) throw new Error("No se pudo crear la sala")
      const data = await res.json()
      setCurrentRoom(data.room_id)
      return data.room_id
    } catch (error) {
      // Removed console log
      throw error
    }
  }, [])

  const joinRoom = useCallback(async (roomId: string) => {
    try {
      // WebSocket: send join room event (if supported)
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ 
          type: "join_room", 
          room_id: roomId 
        }))
      }
      setCurrentRoom(roomId)
    } catch (error) {
      // Removed console log
      throw error
    }
  }, [])

  const leaveRoom = useCallback(() => {
    try {
      if (currentRoom && ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ 
          type: "leave_room", 
          room_id: currentRoom 
        }))
      }
      setCurrentRoom(null)
    } catch (error) {
      // Removed console log
    }
  }, [currentRoom])

  // --- Get users (REST) ---
  const fetchUsers = useCallback(async () => {
    try {
      const { ws: _ws, api: API_URL } = getBackendUrl()
      const res = await fetch(`${API_URL}/users`)
      if (!res.ok) throw new Error("No se pudo obtener usuarios")
      const data = await res.json()
      setUsers(data.users)
    } catch (error) {
      // Removed console log
    }
  }, [])

  // --- Get room info (REST) ---
  const fetchRoomInfo = useCallback(async (roomId: string) => {
    try {
      const { ws: _ws, api: API_URL } = getBackendUrl()
      const res = await fetch(`${API_URL}/rooms/${roomId}`)
      if (!res.ok) throw new Error("No se pudo obtener la sala")
      return await res.json() as RoomInfo
    } catch (error) {
      // Removed console log
      throw error
    }
  }, [])

  return {
    connected: mounted && connected,
    messages,
    users,
    currentUser,
    typingUsers,
    currentRoom,
    sendMessage,
    sendReaction,
    sendTyping: sendTypingThrottled,
    removeMessage,
    createRoom,
    joinRoom,
    leaveRoom,
    fetchUsers,
    fetchRoomInfo,
    // Estados de cifrado
    cryptoSupported,
    roomKey: !!roomKey, // Convertir a boolean para saber si hay cifrado activo
  }
}
