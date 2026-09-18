import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Image as ImageIcon,
  Volume2,
  Loader2,
  Maximize2,
  Eye,
  Flame,
  Smile,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { FileAttachment } from './FileAttachment';
import { BurnCountdown } from './BurnCountdown';
import { copyWithAutoScrub } from '../utils/secureClipboard';

interface MessageListProps {
  messages: ChatMessage[];
  onDownloadFile: (fileId: string, fileName: string, mimeType: string) => Promise<void>;
  onPurgeMessage: (id: string) => void;
  onLoadMedia: (fileId: string, mimeType: string, messageId: string) => Promise<void>;
  onOpenLightbox: (imageUrl: string, imageName: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onOpenViewOnce?: (mediaUrl: string, mimeType: string, messageId: string) => void;
  searchQuery?: string;
  isPeerTyping?: boolean;
  isSpyMode?: boolean;
}

const REACTION_EMOJIS = ['👍', '❤️', '🔥', '🤫', '👁️'];

function highlightText(text: string, query?: string): React.ReactNode {
  if (!query || !query.trim()) return text;
  const q = query.trim();
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="bg-amber-400 text-neutral-950 font-bold px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
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
  onReact,
  onOpenViewOnce,
  searchQuery,
  isPeerTyping = false,
  isSpyMode = false,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  useEffect(() => {
    const handleReset = () => {
      setRevealedId(null);
      setActiveReactionMsgId(null);
    };
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
      onClick={() => setActiveReactionMsgId(null)}
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
            className={`flex flex-col group relative ${msg.is_self ? 'items-end' : 'items-start'}`}
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

              {/* Quick Reactions: Mobile Tap Trigger + Desktop Hover Menu */}
              {onReact && (
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveReactionMsgId((prev) => (prev === msg.id ? null : msg.id));
                    }}
                    className={`p-1 rounded-full transition-all ${
                      activeReactionMsgId === msg.id
                        ? 'text-amber-400 bg-neutral-800 ring-1 ring-amber-500/60 opacity-100'
                        : 'text-neutral-500 hover:text-amber-400 opacity-60 sm:opacity-0 group-hover:opacity-100'
                    }`}
                    title="Reaccionar"
                    aria-label="Reaccionar al mensaje"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>

                  {/* Emoji Floating Bar */}
                  <div
                    className={`absolute bottom-full mb-1 z-30 flex items-center gap-1 bg-neutral-900/95 border border-neutral-750 rounded-full px-2 py-1 shadow-2xl backdrop-blur-md transition-all select-none ${
                      activeReactionMsgId === msg.id
                        ? 'opacity-100 scale-100 pointer-events-auto'
                        : 'opacity-0 scale-95 pointer-events-none sm:group-hover:opacity-100 sm:group-hover:scale-100 sm:group-hover:pointer-events-auto'
                    } ${msg.is_self ? 'right-0' : 'left-0'}`}
                  >
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReact(msg.id, emoji);
                          setActiveReactionMsgId(null);
                        }}
                        className="text-base sm:text-xs hover:scale-130 active:scale-95 transition-transform p-1 rounded-full hover:bg-neutral-800 cursor-pointer"
                        title={`Reaccionar con ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                {/* Message text with Search Highlighting */}
                {(!msg.is_audio || msg.text !== '🎤 Nota de voz cifrada') && (
                  <p className="whitespace-pre-wrap break-words">
                    {highlightText(msg.text, searchQuery)}
                  </p>
                )}

                {/* View-Once Ephemeral Media Card */}
                {msg.is_view_once && (
                  <div className="mt-2 pt-1 border-t border-neutral-800/60">
                    {msg.viewed ? (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-neutral-500 text-xs">
                        <Flame className="w-4 h-4 text-neutral-600" />
                        <span>Contenido efímero ver una sola vez destruido permanentemente</span>
                      </div>
                    ) : msg.is_self ? (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-300 text-xs">
                        <Eye className="w-4 h-4 text-amber-400" />
                        <span>Foto efímera enviada (el receptor solo podrá verla 1 vez durante 7s)</span>
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!msg.file_blob_url && msg.file) {
                            await onLoadMedia(msg.file.file_id, msg.file.mime_type, msg.id);
                          }
                          if (onOpenViewOnce && msg.file) {
                            onOpenViewOnce(msg.file_blob_url || '', msg.file.mime_type, msg.id);
                          }
                        }}
                        disabled={msg.file_downloading}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/70 text-amber-300 font-bold text-xs transition-colors shadow-sm"
                      >
                        {msg.file_downloading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
                        )}
                        <span>👁️ Ver foto efímera (1 sola vez · 7s)</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Steganographic Revealed Payload */}
                {msg.is_stego && msg.stego_hidden_text && (
                  <div className="mt-2 p-2.5 bg-indigo-950/60 border border-indigo-500/50 rounded-xl text-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-indigo-400" /> Mensaje Esteganográfico Oculto (LSB):
                      </span>
                      <button
                        onClick={() => copyWithAutoScrub(msg.stego_hidden_text || '', 30)}
                        className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-indigo-300 transition-colors"
                        title="Copiar texto secreto (auto-scrub 30s)"
                      >
                        Copiar
                      </button>
                    </div>
                    <p className="font-mono text-indigo-100 bg-neutral-950/80 p-2 rounded-lg break-words select-text">
                      {msg.stego_hidden_text}
                    </p>
                  </div>
                )}

                {/* In-Memory Audio Voice Player */}
                {isAudio && (
                  <div className="mt-2 pt-1 border-t border-neutral-800/60">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <Volume2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Nota de voz {msg.audio_duration ? `(${msg.audio_duration}s)` : ''}</span>
                      </div>
                      {msg.voice_effect && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-neutral-800/90 text-[10px] text-emerald-400 font-mono border border-neutral-700/60">
                          {msg.voice_effect === 'deep' && '👤 Grave'}
                          {msg.voice_effect === 'robot' && '🤖 Robot'}
                          {msg.voice_effect === 'radio' && '📻 Radio'}
                          {msg.voice_effect === 'natural' && '🎭 Natural'}
                        </span>
                      )}
                    </div>

                    {msg.audio_blob_url ? (
                      <audio
                        controls
                        src={msg.audio_blob_url}
                        className="w-full h-8 rounded-lg outline-none max-w-xs mt-1"
                      />
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

                {/* In-Memory Image Thumbnail Preview (Disabled for View-Once) */}
                {isImage && !msg.is_view_once && (
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

                {/* Regular File Download (Non-image / Non-voice / Non-view-once) */}
                {msg.file && !isImage && !msg.is_audio && !msg.is_view_once && (
                  <FileAttachment
                    fileId={msg.file.file_id}
                    fileName={msg.file.file_name}
                    fileSize={msg.file.file_size}
                    mimeType={msg.file.mime_type}
                    onDownload={onDownloadFile}
                  />
                )}

                {/* Metadata scrubbed security notice */}
                {msg.file && (
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono mt-1.5 pt-1 border-t border-neutral-800/40">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Metadatos EXIF eliminados · Nombre anónimo</span>
                  </div>
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

            {/* Aggregated Reaction Badges */}
            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mt-1 px-1">
                {Object.entries(msg.reactions).map(([emoji, users]) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReact && onReact(msg.id, emoji);
                    }}
                    className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 hover:border-emerald-500/70 text-xs flex items-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer"
                    title={`Reaccionado por: ${users.join(', ')}`}
                  >
                    <span>{emoji}</span>
                    <span className="text-[10px] text-neutral-300 font-bold">{users.length}</span>
                  </button>
                ))}
                {/* Mobile-friendly Add Reaction Plus Button */}
                {onReact && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveReactionMsgId((prev) => (prev === msg.id ? null : msg.id));
                    }}
                    className="px-1.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-amber-400 text-xs flex items-center gap-0.5 transition-colors active:scale-95 cursor-pointer"
                    title="Añadir reacción"
                  >
                    <Smile className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
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
