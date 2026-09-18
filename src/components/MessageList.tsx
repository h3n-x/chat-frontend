import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Image as ImageIcon,
  Volume2,
  Loader2,
  Maximize2,
  Eye,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { FileAttachment } from './FileAttachment';
import { BurnCountdown } from './BurnCountdown';

interface MessageListProps {
  messages: ChatMessage[];
  onDownloadFile: (fileId: string, fileName: string, mimeType: string) => Promise<void>;
  onPurgeMessage: (id: string) => void;
  onLoadMedia: (fileId: string, mimeType: string, messageId: string) => Promise<void>;
  onOpenLightbox: (imageUrl: string, imageName: string) => void;
  isPeerTyping?: boolean;
  isSpyMode?: boolean;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onDownloadFile,
  onPurgeMessage,
  onLoadMedia,
  onOpenLightbox,
  isPeerTyping = false,
  isSpyMode = false,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);

  useEffect(() => {
    const handleReset = () => setRevealedId(null);
    window.addEventListener('blur', handleReset);
    return () => window.removeEventListener('blur', handleReset);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPeerTyping]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-400 select-none">
        <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3 text-neutral-500 shadow-lg">
          <ShieldCheck className="w-6 h-6 text-emerald-500/80" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-neutral-300">Sala cifrada iniciada</p>
        <p className="text-xs text-neutral-400 max-w-xs mt-1">
          Ningún mensaje se almacena en el servidor ni en tu disco. Envía tu primer mensaje,
          nota de voz o comparte el código QR.
        </p>
      </div>
    );
  }

  return (
    <div
      role="log"
      aria-label="Historial de mensajes"
      className="flex-1 overflow-y-auto p-4 space-y-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {messages.map((msg) => {
        if (msg.corrupted) {
          return (
            <div
              key={msg.id}
              className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2 max-w-md mx-auto"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
              <span>{msg.text}</span>
            </div>
          );
        }

        if (msg.is_system) {
          return (
            <div key={msg.id} className="flex justify-center my-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-[11px] text-neutral-400 font-medium shadow-sm">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: msg.color || '#9CA3AF' }}
                />
                <span>{msg.text}</span>
              </span>
            </div>
          );
        }

        const isImage = msg.file && msg.file.mime_type.startsWith('image/');
        const isAudio = msg.is_audio || (msg.file && msg.file.mime_type.startsWith('audio/'));
        const isRevealed = !isSpyMode || revealedId === msg.id;

        return (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.is_self ? 'items-end' : 'items-start'}`}
          >
            {/* Sender, Time & Burn Countdown */}
            <div className="flex items-center gap-2 mb-1 px-1">
              <span
                className="text-xs font-semibold"
                style={{ color: msg.color || '#10B981' }}
              >
                {msg.is_self ? 'Tú' : msg.sender_name}
              </span>
              <span className="text-[10px] text-neutral-500">
                {formatTime(msg.timestamp)}
              </span>
              {msg.burn_expires_at && (
                <BurnCountdown
                  expiresAt={msg.burn_expires_at}
                  onExpire={() => onPurgeMessage(msg.id)}
                />
              )}
            </div>

            {/* Bubble */}
            <div
              onPointerDown={() => isSpyMode && setRevealedId(msg.id)}
              onPointerUp={() => isSpyMode && setRevealedId(null)}
              onPointerLeave={() => isSpyMode && setRevealedId(null)}
              onPointerCancel={() => isSpyMode && setRevealedId(null)}
              className={`max-w-md md:max-w-lg p-3 rounded-2xl text-sm leading-relaxed shadow-md transition-all ${
                isSpyMode ? 'cursor-pointer select-none active:scale-[0.99]' : ''
              } ${
                msg.is_self
                  ? 'bg-emerald-600/20 text-neutral-100 border border-emerald-500/30 rounded-tr-sm'
                  : 'bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-tl-sm'
              }`}
            >
              <div
                style={{
                  filter: isRevealed ? 'none' : 'blur(9px)',
                  transition: 'filter 0.15s ease-out',
                }}
              >
                {/* Message text */}
                {(!msg.is_audio || msg.text !== '🎤 Nota de voz cifrada') && (
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                )}

                {/* In-Memory Audio Voice Player */}
                {isAudio && (
                  <div className="mt-2 pt-1 border-t border-neutral-800/60">
                    {msg.audio_blob_url ? (
                      <div className="flex flex-col gap-1.5 py-1">
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                          <Volume2 className="w-4 h-4 shrink-0" />
                          <span>Nota de voz cifrada {msg.audio_duration ? `(${msg.audio_duration}s)` : ''}</span>
                        </div>
                        <audio
                          controls
                          src={msg.audio_blob_url}
                          className="w-full h-8 rounded-lg outline-none max-w-xs"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          msg.file && onLoadMedia(msg.file.file_id, msg.file.mime_type, msg.id)
                        }
                        disabled={msg.file_downloading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-xs text-emerald-400 font-medium transition-colors"
                      >
                        {msg.file_downloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                        <span>
                          {msg.file_downloading ? 'Descifrando audio...' : '▶ Cargar nota de voz cifrada'}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* In-Memory Image Thumbnail Preview */}
                {isImage && (
                  <div className="mt-2.5">
                    {msg.file_blob_url ? (
                      <div className="relative group rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 max-w-xs cursor-pointer shadow-inner">
                        <img
                          src={msg.file_blob_url}
                          alt={msg.file?.file_name || 'Imagen cifrada'}
                          className="max-h-60 w-auto object-cover rounded-xl transition-transform group-hover:scale-[1.02]"
                          onClick={() => onOpenLightbox(msg.file_blob_url!, msg.file?.file_name || 'Imagen')}
                        />
                        <div
                          onClick={() => onOpenLightbox(msg.file_blob_url!, msg.file?.file_name || 'Imagen')}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <div className="p-2 rounded-full bg-neutral-900/80 backdrop-blur-sm border border-white/20">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          msg.file && onLoadMedia(msg.file.file_id, msg.file.mime_type, msg.id)
                        }
                        disabled={msg.file_downloading}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-xs text-emerald-400 font-medium transition-colors"
                      >
                        {msg.file_downloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ImageIcon className="w-4 h-4" />
                        )}
                        <span>
                          {msg.file_downloading ? 'Descifrando imagen en RAM...' : '👁️ Ver vista previa de imagen'}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Regular File Download (Non-image / Non-voice) */}
                {msg.file && !isImage && !msg.is_audio && (
                  <FileAttachment
                    fileId={msg.file.file_id}
                    fileName={msg.file.file_name}
                    fileSize={msg.file.file_size}
                    mimeType={msg.file.mime_type}
                    onDownload={onDownloadFile}
                  />
                )}
              </div>

              {/* Spy Mode Reveal Hint */}
              {isSpyMode && !isRevealed && (
                <div className="flex items-center justify-center gap-1.5 pt-1 text-[10px] text-emerald-400/90 font-mono select-none">
                  <Eye className="w-3 h-3 animate-pulse" />
                  <span>Mantén presionado para revelar</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Typing Indicator Bubble */}
      {isPeerTyping && (
        <div className="flex flex-col items-start animate-fade-in">
          <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-neutral-400 text-xs shadow-sm">
            <span className="text-[11px] font-medium mr-1">Un participante está escribiendo</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
