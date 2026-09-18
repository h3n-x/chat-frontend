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
  burn_ttl?: number; // TTL in seconds (e.g. 15, 30, 60, 300)
  is_audio?: boolean;
  audio_duration?: number;
  voice_effect?: 'natural' | 'robot' | 'radio' | 'deep';
  is_decoy?: boolean; // Chaffing traffic frame to neutralize timing analysis
  is_remote_nuke?: boolean; // Collective killswitch signal
  is_view_once?: boolean; // Ephemeral view-once media
  is_stego?: boolean; // Steganographic carrier image
  stego_hidden_text?: string;
  is_reaction_signal?: boolean;
  target_message_id?: string;
  reaction_emoji?: string;
  reactions?: Record<string, string[]>; // { "👍": ["User1", "User2"] }
  file?: {
    file_id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    is_metadata_scrubbed?: boolean;
  };
}

export interface ChatMessage extends DecryptedMessagePlaintext {
  is_self: boolean;
  is_system?: boolean;
  corrupted?: boolean;
  viewed?: boolean; // Has ephemeral view-once media been opened and expired
  file_blob_url?: string;
  file_downloading?: boolean;
  audio_blob_url?: string;
  burn_expires_at?: number; // timestamp in ms when the message must be deleted
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'reconnecting'
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

export interface WSInboundTypingFrame {
  type: 'typing';
  room_id: string;
  sender_id: string;
  is_typing: boolean;
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
  | WSInboundTypingFrame
  | WSInboundPongFrame
  | WSInboundErrorFrame;
