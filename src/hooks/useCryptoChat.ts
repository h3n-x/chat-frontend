import { useState, useCallback, useRef, useEffect } from 'react';
import { API_BASE_URL, MAX_FILE_SIZE_BYTES } from '../config';
import {
  generateRoomKey,
  exportKeyToBase64,
  importKeyFromBase64,
  encryptJson,
  decryptJson,
  encryptBytes,
  decryptBytes,
  generateHandshakeKeyPair,
  deriveWrappingKey,
  wrapRoomKey,
  unwrapRoomKey,
  generateFingerprint,
  ECDHKeyPair,
} from '../crypto/webcrypto';
import {
  ChatMessage,
  DecryptedMessagePlaintext,
  WSInboundFrame,
  EncryptedPayload,
} from '../types';
import { useWebSocket } from './useWebSocket';

const ANONYMOUS_ADJECTIVES = ['Sombra', 'Fantasma', 'Cripto', 'Espectro', 'Sigilo', 'Silencio', 'Vórtice'];
const ACCENT_COLORS = ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EC4899', '#3B82F6'];

function getRandomIdentity() {
  const adj = ANONYMOUS_ADJECTIVES[Math.floor(Math.random() * ANONYMOUS_ADJECTIVES.length)];
  const num = Math.floor(10 + Math.random() * 90);
  const color = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)]!;
  return { name: `${adj}-${num}`, color };
}

export function useCryptoChat() {
  const [roomId, setRoomId] = useState<string>('');
  const [roomKey, setRoomKey] = useState<CryptoKey | null>(null);
  const [roomKeyBase64, setRoomKeyBase64] = useState<string>('');
  const [fingerprint, setFingerprint] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [identity] = useState(getRandomIdentity);
  const [isHandshaking, setIsHandshaking] = useState<boolean>(false);
  const [handshakeError, setHandshakeError] = useState<string | null>(null);
  const [isSasVerified, setIsSasVerified] = useState<boolean>(false);
  const [isSasModalOpen, setIsSasModalOpen] = useState<boolean>(false);
  const hasAutoOpenedSasRef = useRef<boolean>(false);

  // In-memory ECDH handshake state
  const handshakeRef = useRef<ECDHKeyPair | null>(null);
  const roomKeyRef = useRef<CryptoKey | null>(null);

  useEffect(() => {
    roomKeyRef.current = roomKey;
  }, [roomKey]);

  // Handle incoming WebSocket frames
  const handleWebSocketFrame = useCallback(
    async (frame: WSInboundFrame) => {
      // 1. E2EE Messages
      if (frame.type === 'e2ee_message') {
        const currentKey = roomKeyRef.current;
        if (!currentKey) {
          console.warn('Received e2ee_message before room key was established.');
          return;
        }

        try {
          const plaintext = await decryptJson<DecryptedMessagePlaintext>(
            currentKey,
            frame.payload,
            frame.room_id
          );

          setMessages((prev) => [
            ...prev,
            {
              ...plaintext,
              is_self: false,
            },
          ]);
        } catch (err) {
          console.error('Decryption failed for received frame:', err);
          // Zero-tolerance: display corrupted message warning without processing malicious data
          setMessages((prev) => [
            ...prev,
            {
              id: `corrupted-${Date.now()}`,
              sender_name: 'Desconocido',
              color: '#EF4444',
              text: '⚠️ Mensaje corrupto o clave incorrecta (verificación de autenticidad falló).',
              timestamp: Date.now(),
              is_self: false,
              corrupted: true,
            },
          ]);
        }
      }

      // 2. Handshake: Peer requesting the room key
      else if (frame.type === 'key_request') {
        const currentKey = roomKeyRef.current;
        if (currentKey) {
          try {
            // Generate ephemeral key for response
            const myEphemeral = await generateHandshakeKeyPair();
            const wrappingKey = await deriveWrappingKey(
              myEphemeral.keyPair.privateKey,
              frame.pk
            );
            const { wrappedKeyBase64, ivBase64 } = await wrapRoomKey(
              wrappingKey,
              currentKey
            );

            sendFrame({
              type: 'key_delivery',
              room_id: frame.room_id,
              target_id: frame.sender_id,
              pk: myEphemeral.publicKeyBase64,
              wrapped_key: wrappedKeyBase64,
              iv: ivBase64,
            });
          } catch (e) {
            console.error('Failed to service key_request:', e);
          }
        }
      }

      // 3. Handshake: Receiving delivered room key
      else if (frame.type === 'key_delivery') {
        if (handshakeRef.current && !roomKeyRef.current) {
          try {
            const wrappingKey = await deriveWrappingKey(
              handshakeRef.current.keyPair.privateKey,
              frame.pk
            );
            const unwrappedKey = await unwrapRoomKey(
              wrappingKey,
              frame.wrapped_key,
              frame.iv
            );

            const b64 = await exportKeyToBase64(unwrappedKey);
            const fp = await generateFingerprint(unwrappedKey);

            setRoomKey(unwrappedKey);
            setRoomKeyBase64(b64);
            setFingerprint(fp);
            setIsHandshaking(false);
            handshakeRef.current = null;
          } catch (e) {
            console.error('Failed to unwrap delivered key:', e);
            setHandshakeError('No se pudo verificar el intercambio de claves con los participantes.');
          }
        }
      }

      // 4. Peer Joined Notification
      else if (frame.type === 'peer_joined') {
        setMessages((prev) => [
          ...prev,
          {
            id: `system-joined-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            sender_name: 'Sistema',
            color: '#10B981',
            text: `Un participante se ha conectado (${frame.participant_count} en la sala)`,
            timestamp: Date.now(),
            is_self: false,
            is_system: true,
          },
        ]);
      }

      // 5. Peer Left Notification
      else if (frame.type === 'peer_left') {
        setMessages((prev) => [
          ...prev,
          {
            id: `system-left-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            sender_name: 'Sistema',
            color: '#EF4444',
            text: `Un participante se ha desconectado (${frame.participant_count} en la sala)`,
            timestamp: Date.now(),
            is_self: false,
            is_system: true,
          },
        ]);
      }
    },
    []
  );

  const { status, participantCount, socketError, sendFrame } = useWebSocket({
    roomId,
    onMessage: handleWebSocketFrame,
    enabled: !!roomId,
  });

  // Action: Create Room
  const createRoom = useCallback(async () => {
    setHandshakeError(null);
    setMessages([]);

    const res = await fetch(`${API_BASE_URL}/api/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Error creando sala: ${res.statusText}`);
    }

    const data = await res.json();
    const newRoomId = data.room_id;

    // Generate random AES-256-GCM key in memory
    const key = await generateRoomKey();
    const keyB64 = await exportKeyToBase64(key);
    const fp = await generateFingerprint(key);

    setRoomKey(key);
    setRoomKeyBase64(keyB64);
    setFingerprint(fp);
    setRoomId(newRoomId);

    // Update URL hash for Method A direct link sharing (zero-knowledge)
    window.location.hash = `room=${newRoomId}&key=${encodeURIComponent(keyB64)}`;

    return { roomId: newRoomId, keyB64 };
  }, []);

  // Action: Join Room with Key (Method A)
  const joinWithKey = useCallback(async (newRoomId: string, base64Key: string) => {
    setHandshakeError(null);
    setMessages([]);

    const key = await importKeyFromBase64(base64Key);
    const fp = await generateFingerprint(key);

    setRoomKey(key);
    setRoomKeyBase64(base64Key);
    setFingerprint(fp);
    setRoomId(newRoomId);
  }, []);

  // Action: Join Room by Code (Method B: ECDH Handshake)
  const joinWithCodeOnly = useCallback(
    async (newRoomId: string) => {
      setHandshakeError(null);
      setMessages([]);
      setIsHandshaking(true);
      setRoomKey(null);
      setRoomKeyBase64('');
      setFingerprint('');

      // Generate ephemeral ECDH keypair
      const ephemeral = await generateHandshakeKeyPair();
      handshakeRef.current = ephemeral;
      setRoomId(newRoomId);
    },
    []
  );

  // When connected over WebSocket and handshaking, send KEY_REQUEST
  useEffect(() => {
    if (status === 'connected' && isHandshaking && handshakeRef.current && roomId) {
      sendFrame({
        type: 'key_request',
        room_id: roomId,
        pk: handshakeRef.current.publicKeyBase64,
      });
    }
  }, [status, isHandshaking, roomId, sendFrame]);

  // Action: Send Text Message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!roomKey || !roomId || !text.trim()) return;

      const plaintext: DecryptedMessagePlaintext = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender_name: identity.name,
        color: identity.color,
        text: text.trim(),
        timestamp: Date.now(),
      };

      // Encrypt with AES-256-GCM + AAD
      const envelope = await encryptJson(roomKey, plaintext, roomId);

      // Relay through server
      const sent = sendFrame({
        type: 'e2ee_message',
        room_id: roomId,
        payload: envelope,
      });

      if (sent) {
        setMessages((prev) => [...prev, { ...plaintext, is_self: true }]);
      }
    },
    [roomKey, roomId, identity, sendFrame]
  );

  // Action: Upload & Send Encrypted File
  const sendEncryptedFile = useCallback(
    async (file: File) => {
      if (!roomKey || !roomId) return;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error('El archivo supera el límite máximo de 15 MB.');
      }

      // 1. Read file bytes locally
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      // 2. Encrypt locally in memory with AES-256-GCM
      const envelope = await encryptBytes(roomKey, uint8, roomId);

      // 3. Prepare opaque payload for streaming upload
      // Combine ciphertext and IV into binary or JSON payload for streaming
      const opaqueBlob = new Blob(
        [
          JSON.stringify({
            ciphertext: envelope.ciphertext,
            iv: envelope.iv,
            v: 2,
          }),
        ],
        { type: 'application/octet-stream' }
      );

      // 4. Stream to backend relay
      const uploadRes = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: opaqueBlob,
      });

      if (!uploadRes.ok) {
        throw new Error('Error al subir el archivo al relay.');
      }

      const uploadData = await uploadRes.json();
      const fileId = uploadData.file_id;

      // 5. Send announcement via E2EE message
      const plaintext: DecryptedMessagePlaintext = {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender_name: identity.name,
        color: identity.color,
        text: `📎 Archivo compartido: ${file.name}`,
        timestamp: Date.now(),
        file: {
          file_id: fileId,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
        },
      };

      const msgEnvelope = await encryptJson(roomKey, plaintext, roomId);
      sendFrame({
        type: 'e2ee_message',
        room_id: roomId,
        payload: msgEnvelope,
      });

      // Show locally with immediate object URL
      const localUrl = URL.createObjectURL(file);
      setMessages((prev) => [
        ...prev,
        {
          ...plaintext,
          is_self: true,
          file_blob_url: localUrl,
        },
      ]);
    },
    [roomKey, roomId, identity, sendFrame]
  );

  // Action: Download & Decrypt File
  const downloadAndDecryptFile = useCallback(
    async (fileId: string, fileName: string, mimeType: string) => {
      if (!roomKey || !roomId) return;

      const res = await fetch(`${API_BASE_URL}/api/files/download/${fileId}`);
      if (!res.ok) {
        throw new Error('El archivo ha expirado o ya no está disponible.');
      }

      const rawText = await res.text();
      const envelope = JSON.parse(rawText) as EncryptedPayload;

      // Decrypt with RoomKey and verify AAD
      const decryptedBytes = await decryptBytes(roomKey, envelope, roomId);
      const blob = new Blob([decryptedBytes as unknown as BlobPart], { type: mimeType });
      const url = URL.createObjectURL(blob);

      // Trigger safe download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    },
    [roomKey, roomId]
  );

  // Auto-prompt SAS verification modal when peer joins and SAS is unverified
  useEffect(() => {
    if (participantCount > 1 && fingerprint && !isSasVerified && !hasAutoOpenedSasRef.current) {
      hasAutoOpenedSasRef.current = true;
      setIsSasModalOpen(true);
    }
  }, [participantCount, fingerprint, isSasVerified]);

  // Action: Leave Room
  const leaveRoom = useCallback(() => {
    setRoomId('');
    setRoomKey(null);
    setRoomKeyBase64('');
    setFingerprint('');
    setMessages([]);
    setIsHandshaking(false);
    setIsSasVerified(false);
    setIsSasModalOpen(false);
    hasAutoOpenedSasRef.current = false;
    window.location.hash = '';
  }, []);

  // Action: Confirm SAS match (unblocks chatting)
  const confirmSasMatch = useCallback(() => {
    setIsSasVerified(true);
    setIsSasModalOpen(false);
  }, []);

  // Action: Reject SAS match (potential MITM -> immediate abort)
  const rejectSasMatch = useCallback(() => {
    setIsSasVerified(false);
    setIsSasModalOpen(false);
    leaveRoom();
  }, [leaveRoom]);

  // Action: Open SAS Modal manually
  const openSasModal = useCallback(() => {
    setIsSasModalOpen(true);
  }, []);

  return {
    roomId,
    roomKey,
    roomKeyBase64,
    fingerprint,
    identity,
    messages,
    status,
    participantCount,
    socketError: socketError || handshakeError,
    isHandshaking,
    isSasVerified,
    isSasModalOpen,
    confirmSasMatch,
    rejectSasMatch,
    openSasModal,
    createRoom,
    joinWithKey,
    joinWithCodeOnly,
    sendMessage,
    sendEncryptedFile,
    downloadAndDecryptFile,
    leaveRoom,
  };
}

