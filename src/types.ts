export interface EncryptedPayload {
  ciphertext: string; // Base64 AES-256-GCM ciphertext + tag
  iv: string;         // Base64 12-byte IV
  v: number;          // Protocol version (2)
}

export interface DecryptedMessagePlaintext {
  id: string;
  sender_name: string;
  color: string;
  text: string;
  timestamp: number;
  file?: {
    file_id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
  };
}

export interface ChatMessage extends DecryptedMessagePlaintext {
  is_self: boolean;
  is_system?: boolean;
  corrupted?: boolean;
  file_blob_url?: string;
  file_downloading?: boolean;
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'handshaking'
  | 'connected'
  | 'error';

// --- WebSocket Frame Types ---

export interface WSInboundMessageFrame {
  type: 'e2ee_message';
  room_id: string;
  sender_id: string;
  payload: EncryptedPayload;
}

export interface WSInboundKeyRequestFrame {
  type: 'key_request';
  room_id: string;
  sender_id: string;
  pk: string;
}

export interface WSInboundKeyDeliveryFrame {
  type: 'key_delivery';
  room_id: string;
  sender_id: string;
  target_id?: string;
  pk: string;
  wrapped_key: string;
  iv: string;
}

export interface WSInboundRoomWelcomeFrame {
  type: 'room_welcome';
  room_id: string;
  peer_id: string;
  participant_count: number;
}

export interface WSInboundPeerJoinedFrame {
  type: 'peer_joined';
  room_id: string;
  peer_id: string;
  participant_count: number;
}

export interface WSInboundPeerLeftFrame {
  type: 'peer_left';
  room_id: string;
  peer_id: string;
  participant_count: number;
}

export interface WSInboundPongFrame {
  type: 'pong';
}

export interface WSInboundErrorFrame {
  type: 'error';
  code: string;
  message: string;
}

export type WSInboundFrame =
  | WSInboundRoomWelcomeFrame
  | WSInboundMessageFrame
  | WSInboundKeyRequestFrame
  | WSInboundKeyDeliveryFrame
  | WSInboundPeerJoinedFrame
  | WSInboundPeerLeftFrame
  | WSInboundPongFrame
  | WSInboundErrorFrame;
