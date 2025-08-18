"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useChatApi } from "@/lib/chat-api"
import { createNotificationSound } from "@/lib/notification-sound"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Users, Settings, Sparkles, MessageCircle } from "lucide-react"
import ChatMessage from "./chat-message"
import UserList from "./user-list"
import ConnectionStatus from "./connection-status"
import { RoomManager } from "./room-manager"
import { TypingIndicator } from "./typing-indicator"
import { ThemeToggle } from "./theme-toggle"


/**
 * Main chat interface component with glassmorphism design
 *
 * Features:
 * - Real-time chat
 * - Glassmorphism UI with blur effects and transparency
 * - Private room management
 * - Message reactions system
 * - User list with connection status
 * - Responsive design for mobile and desktop
 * - Theme toggle (light/dark mode)
 * - Typing indicators
 * - Connection status monitoring
 * - Auto-deletion of ALL messages after 1 minute (for total anonymity)
 * - No persistent message history
 *
 * @returns {JSX.Element} The complete chat interface
 */
export default function ChatInterface() {
  // Estado local para el input del mensaje y la visibilidad de la lista de usuarios (mobile)
  const [currentMessage, setCurrentMessage] = useState("")
  const [showUserList, setShowUserList] = useState(false)
  
  // Estado para auto-eliminación de mensajes
  const messageTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const previousMessageCount = useRef(0)
  
  // Estado para el typing indicator
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Ref para el scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const playNotificationSound = useRef<(() => void) | null>(null)

  // Hook de conexión real
  const {
    connected: isConnected,
    messages,
    users,
    currentUser,
    typingUsers,
    currentRoom,
    sendMessage,
    sendReaction,
    sendTyping,
    removeMessage,
    createRoom,
    joinRoom,
    leaveRoom,
    cryptoSupported,
    roomKey: isCryptoActive,
  } = useChatApi()

  // Debug: Log messages changes (silencioso)
  useEffect(() => {
    // Silencioso - no mostrar actualizaciones de mensajes en consola
  }, [messages])

  // Función para manejar el typing indicator con debounce
  const handleTypingIndicator = () => {
    // Enviar que está escribiendo
    sendTyping()
    
    // Limpiar timeout anterior si existe
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Programar envío de "no typing" después de 3 segundos de inactividad
    typingTimeoutRef.current = setTimeout(() => {
      // Usuario dejó de escribir (silencioso)
    }, 3000)
  }

  // Enviar mensaje
  const handleSendMessage = () => {
    if (!currentMessage.trim()) return
    sendMessage(currentMessage)
    setCurrentMessage("")
  }

  // Enter para enviar
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    } else {
      // Notificar typing solo cuando el usuario escribe
      sendTyping()
    }
  }

  // Unirse a sala
  const handleJoinRoom = async (roomId: string) => {
    await joinRoom(roomId)
  }

  // Salir de sala
  const handleLeaveRoom = () => {
    leaveRoom()
  }

  // Crear sala
  const handleCreateRoom = async () => {
    await createRoom()
  }

  // Reaccionar mensaje
  const handleReaction = (messageId: string, emoji: string) => {
    sendReaction(messageId, emoji)
  }

    // Auto-scroll hacia abajo cuando lleguen nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Efecto para auto-eliminación de mensajes después de 1 minuto
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      
      // Solo reproducir sonido si hay MÁS mensajes que antes (mensaje nuevo)
      // No reproducir si hay MENOS mensajes (auto-eliminación)
      const isNewMessage = messages.length > previousMessageCount.current
      
      if (isNewMessage && lastMessage.user_id !== currentUser?.id && lastMessage.type !== "system_message") {
        playNotificationSound.current?.()
      }
      
      // Actualizar contador de mensajes
      previousMessageCount.current = messages.length
      
      // Configurar timer para auto-eliminar cada mensaje después de 30 segundos (más agresivo)
      messages.forEach((message: any) => {
        if (message.id && !messageTimers.current.has(message.id)) {
          const timer = setTimeout(() => {
            removeMessage(message.id!)
            messageTimers.current.delete(message.id!)
            // Mensaje auto-eliminado por timeout (silencioso)
          }, 30000) // 30 segundos para máximo anonimato
          
          messageTimers.current.set(message.id, timer)
        }
      })
      
      // Scroll automático solo para mensajes nuevos
      if (isNewMessage) {
        scrollToBottom()
      }
    }
  }, [messages, currentUser, removeMessage])

  // Limpieza agresiva al desmontar
  useEffect(() => {
    return () => {
      // Limpiar todos los timers al desmontar
      messageTimers.current.forEach((timer) => clearTimeout(timer))
      messageTimers.current.clear()
      
      // Limpiar cualquier data persistente
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem('chat-messages')
          localStorage.removeItem('chat-user')
          localStorage.removeItem('chat-room-key')
          sessionStorage.clear()
          // Limpieza total al desmontar componente (silencioso)
        } catch (e) {
          // Error en limpieza (silencioso)
        }
      }
    }
  }, [])

  // Limpieza periódica cada 15 segundos
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (messages.length > 10) {
        // Limpieza periódica: eliminando mensajes antiguos (silencioso)
        // Mantener solo los últimos 5 mensajes
        const messagesToKeep = messages.slice(-5)
        messagesToKeep.forEach((msg: any, index: any) => {
          if (index < messagesToKeep.length - 5) {
            if (msg.id) removeMessage(msg.id)
          }
        })
      }
    }, 15000) // Cada 15 segundos

    return () => clearInterval(cleanupInterval)
  }, [messages, removeMessage])

  // Inicializar sonido de notificación al montar el componente
  useEffect(() => {
    if (typeof window !== "undefined") {
      playNotificationSound.current = createNotificationSound()
    }
  }, [])

  // Efecto para scroll cuando cambia el usuario actual  
  useEffect(() => {
    if (currentUser) {
      scrollToBottom()
    }
  }, [currentUser])

  // Limpiar timers al desmontar el componente
  useEffect(() => {
    return () => {
      messageTimers.current.forEach((timer) => clearTimeout(timer))
      messageTimers.current.clear()
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Header - Mobile */}
      <div className="lg:hidden glass bg-card/80 border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center animate-pulse-slow">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg font-sans">Chat Anónimo</h1>
            <ConnectionStatus isConnected={isConnected} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUserList(!showUserList)}
            className="glass hover:bg-accent/20"
          >
            <Users className="w-4 h-4" />
            <Badge variant="secondary" className="ml-2 glass">
              {users.length}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col">
        <Card className="h-full glass bg-sidebar/80 border-sidebar-border rounded-none">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary/80 flex items-center justify-center animate-float shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl font-sans text-sidebar-foreground">Chat Anónimo</h1>
                  <p className="text-sm text-muted-foreground">Glassmorphism UI</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
            <div className="space-y-2">
              <ConnectionStatus isConnected={isConnected} />
              {/* Indicador de cifrado */}
              <div className="flex items-center gap-2">
                {isCryptoActive ? (
                  cryptoSupported ? (
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <span>🔐 Cifrado E2EE activo (AES-256)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-yellow-400">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                      <span>� Cifrado de fallback activo (XOR)</span>
                    </div>
                  )
                ) : cryptoSupported ? (
                  <div className="flex items-center gap-1 text-xs text-yellow-400">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <span>🔑 Esperando clave de cifrado...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-red-400">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <span>⚠️ Cifrado no disponible</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Room Manager */}
          <div className="p-4 border-b border-sidebar-border">
            <RoomManager
              currentRoom={currentRoom}
              onJoinRoom={handleJoinRoom}
              onLeaveRoom={handleLeaveRoom}
              onCreateRoom={handleCreateRoom}
              isConnected={isConnected}
            />
          </div>

          {/* User Info */}
          {currentUser && (
            <div className="p-4 border-b border-sidebar-border">
              <div className="glass bg-sidebar-accent/50 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: currentUser.color }}
                  >
                    {currentUser.username.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sidebar-foreground">{currentUser.username}</p>
                    <p className="text-xs text-muted-foreground">Tu identidad anónima</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="flex-1 overflow-hidden">
            <UserList users={users} />
          </div>
        </Card>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Desktop Header */}
        <div className="hidden lg:block glass bg-card/80 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              <span className="font-medium">{currentRoom ? `Sala ${currentRoom}` : "Chat Principal"}</span>
              <Badge variant="secondary" className="glass">
                {users.length} usuarios conectados
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="glass hover:bg-accent/20">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Indicador de auto-eliminación */}
          {messages.length > 0 && (
            <div className="flex justify-center mb-4">
              <div className="glass bg-card/60 border border-border/30 rounded-full px-4 py-2 text-xs text-muted-foreground">
                🔒 Todos los mensajes se auto-eliminan después de 1 minuto para total anonimato
              </div>
            </div>
          )}
          
          {messages.map((message: any, index: any) => (
            <ChatMessage
              key={message.id || `message-${index}`}
              message={message}
              onReact={handleReaction}
              isOwnMessage={message.user_id === currentUser?.id}
            />
          ))}
          {typingUsers.length > 0 && <TypingIndicator typingUsers={typingUsers} />}
          {/* Elemento invisible para auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-border glass bg-card/80">
          <div className="flex gap-3" suppressHydrationWarning>
            <div className="flex-1">
              <Input
                value={currentMessage}
                onChange={(e) => {
                  setCurrentMessage(e.target.value)
                  // Enviar indicador de typing cuando el usuario escribe
                  if (e.target.value.length > 0) {
                    handleTypingIndicator()
                  }
                }}
                onKeyPress={handleKeyPress}
                placeholder={currentRoom ? `Mensaje en sala ${currentRoom}...` : "Escribe tu mensaje anónimo..."}
                className="glass bg-input/80 border-border/50 focus:border-accent/50 focus:ring-accent/30 rounded-xl"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim()}
              className="glass bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile User List Overlay */}
      {showUserList && (
        <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-50 animate-fade-in">
          <div className="absolute right-0 top-0 h-full w-80 glass bg-sidebar/90 border-l border-sidebar-border animate-slide-up">
            <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
              <h2 className="font-semibold">Usuarios Conectados</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowUserList(false)}>
                ✕
              </Button>
            </div>
            <UserList users={users} />
          </div>
        </div>
      )}
    </div>
  )
}
