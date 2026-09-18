import React, { useState } from 'react';
import { LogOut, Share2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { SecurityBadge } from './SecurityBadge';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatMessage, ConnectionStatus } from '../types';

interface ChatRoomProps {
  roomId: string;
  roomKeyBase64: string;
  fingerprint: string;
  participantCount: number;
  status: ConnectionStatus;
  socketError: string | null;
  isHandshaking: boolean;
  identity: { name: string; color: string };
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  onDownloadFile: (fileId: string, fileName: string, mimeType: string) => Promise<void>;
  onLeave: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  roomId,
  roomKeyBase64,
  fingerprint,
  participantCount,
  status,
  socketError,
  isHandshaking,
  identity,
  messages,
  onSendMessage,
  onSendFile,
  onDownloadFile,
  onLeave,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareLink = () => {
    // Generate Zero-Knowledge direct link using URL hash fragment (RFC 3986)
    const shareUrl = `${window.location.origin}/#room=${roomId}&key=${encodeURIComponent(roomKeyBase64)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto w-full bg-neutral-950 border-x border-neutral-800/80 shadow-2xl">
      {/* Top Header */}
      <header className="px-4 py-3 bg-neutral-900/90 border-b border-neutral-800 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
        {/* Left: Room Badge and Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 px-3 py-1 rounded-xl">
            <span className="text-xs text-neutral-400">Sala:</span>
            <span className="font-mono font-bold text-sm tracking-wider text-emerald-400">
              {roomId}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: identity.color }}
            />
            <span className="text-neutral-300 font-medium truncate max-w-[120px]">
              {identity.name}
            </span>
          </div>
        </div>

        {/* Right: Actions (Share Link, Leave) */}
        <div className="flex items-center gap-2">
          {roomKeyBase64 && (
            <button
              onClick={handleShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              title="Copiar enlace seguro con clave en hash fragment"
              aria-label="Compartir enlace seguro de la sala"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">¡Enlace Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Compartir Enlace</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 text-red-300 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Salir y purgar sesión de memoria"
            aria-label="Salir de la sala"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Sub-header: Security & Status */}
      <div className="px-4 py-2 shrink-0 space-y-2">
        <SecurityBadge
          fingerprint={fingerprint}
          participantCount={participantCount}
        />

        {/* Error Alert */}
        {socketError && (
          <div
            role="alert"
            className="p-2.5 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
            <span>{socketError}</span>
          </div>
        )}

        {/* Handshake Progress Alert */}
        {isHandshaking && (
          <div
            role="status"
            aria-live="polite"
            className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <span>
              Realizando intercambio de claves efímero (ECDH P-256) con los participantes de la sala...
            </span>
          </div>
        )}
      </div>

      {/* Message Feed */}
      <MessageList
        messages={messages}
        onDownloadFile={onDownloadFile}
      />

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onSendFile={onSendFile}
        disabled={status !== 'connected' || isHandshaking || !fingerprint}
      />
    </div>
  );
};
