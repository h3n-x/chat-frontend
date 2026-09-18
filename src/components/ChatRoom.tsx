import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut,
  Share2,
  Check,
  AlertCircle,
  Loader2,
  KeyRound,
  QrCode,
  Volume2,
  VolumeX,
  Flame,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SecurityBadge } from './SecurityBadge';
import { SasVerificationModal } from './SasVerificationModal';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { QrCodeModal } from './QrCodeModal';
import { ImageLightboxModal } from './ImageLightboxModal';
import { PanicOverlay } from './PanicOverlay';
import { isSoundMuted, toggleSoundMuted } from '../utils/audio';
import { ChatMessage, ConnectionStatus } from '../types';

interface ChatRoomProps {
  roomId: string;
  roomKeyBase64: string;
  fingerprint: string;
  participantCount: number;
  status: ConnectionStatus;
  socketError: string | null;
  isHandshaking: boolean;
  isSasVerified: boolean;
  isSasModalOpen: boolean;
  isPeerTyping: boolean;
  identity: { name: string; color: string };
  messages: ChatMessage[];
  onSendMessage: (text: string, burnTtl?: number) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  onSendAudio: (blob: Blob, durationSec: number) => Promise<void>;
  onDownloadFile: (fileId: string, fileName: string, mimeType: string) => Promise<void>;
  onLoadMedia: (fileId: string, mimeType: string, messageId: string) => Promise<void>;
  onPurgeMessage: (id: string) => void;
  onTyping: (isTyping: boolean) => void;
  onLeave: () => void;
  onNuke: () => void;
  onConfirmSasMatch: () => void;
  onRejectSasMatch: () => void;
  onOpenSasModal: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  roomId,
  roomKeyBase64,
  fingerprint,
  participantCount,
  status,
  socketError,
  isHandshaking,
  isSasVerified,
  isSasModalOpen,
  isPeerTyping,
  identity,
  messages,
  onSendMessage,
  onSendFile,
  onSendAudio,
  onDownloadFile,
  onLoadMedia,
  onPurgeMessage,
  onTyping,
  onLeave,
  onNuke,
  onConfirmSasMatch,
  onRejectSasMatch,
  onOpenSasModal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(isSoundMuted());
  const [isBlurred, setIsBlurred] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

  // Esc x 3 Panic shortcut detector
  const escCountRef = useRef<number>(0);
  const escTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        escCountRef.current += 1;
        if (escTimerRef.current) clearTimeout(escTimerRef.current);

        if (escCountRef.current >= 3) {
          escCountRef.current = 0;
          onNuke();
        } else {
          escTimerRef.current = window.setTimeout(() => {
            escCountRef.current = 0;
          }, 1500);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Clear clipboard and blur overlay if PrintScreen is detected
      if (e.key === 'PrintScreen') {
        try {
          navigator.clipboard.writeText('');
        } catch {}
        setIsBlurred(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      }
    };

    const handleBlur = () => {
      setIsBlurred(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      if (escTimerRef.current) clearTimeout(escTimerRef.current);
    };
  }, [onNuke]);

  const shareUrl = `${window.location.origin}/#room=${roomId}&key=${encodeURIComponent(roomKeyBase64)}`;

  const handleShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleToggleSound = () => {
    const next = toggleSoundMuted();
    setIsMuted(next);
  };

  const [isSpyMode, setIsSpyMode] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('chat_zk_spy_mode') === 'true';
  });

  const handleToggleSpyMode = () => {
    setIsSpyMode((prev) => {
      const next = !prev;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('chat_zk_spy_mode', next ? 'true' : 'false');
      }
      return next;
    });
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col h-screen max-w-4xl mx-auto w-full bg-neutral-950 border-x border-neutral-800/80 shadow-2xl relative select-none"
    >
      {/* Anti-Shoulder Surfing / Anti-Capture Overlay */}
      <PanicOverlay isVisible={isBlurred} onDismiss={() => setIsBlurred(false)} />

      {/* Local Zero-Knowledge SVG QR Code Modal */}
      <QrCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        inviteUrl={shareUrl}
        roomId={roomId}
      />

      {/* In-Memory Lightbox Viewer */}
      <ImageLightboxModal
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        imageUrl={lightboxImage?.url || ''}
        imageName={lightboxImage?.name || ''}
      />

      {/* Sas Verification Modal */}
      <SasVerificationModal
        fingerprint={fingerprint}
        isOpen={isSasModalOpen}
        onConfirmMatch={onConfirmSasMatch}
        onRejectMatch={onRejectSasMatch}
      />

      {/* Top Header */}
      <header className="px-3 sm:px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
        {/* Left: Room Badge and Identity */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 px-2.5 py-1 rounded-xl">
            <span className="text-[11px] text-neutral-400 hidden xs:inline">Sala:</span>
            <span className="font-mono font-bold text-xs sm:text-sm tracking-wider text-emerald-400">
              {roomId}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: identity.color }}
            />
            <span className="text-neutral-300 font-medium truncate max-w-[110px]">
              {identity.name}
            </span>
          </div>
        </div>

        {/* Right: Actions (QR, Sound, Share, Nuke, Leave) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* QR Code Modal Trigger */}
          {roomKeyBase64 && (
            <button
              onClick={() => setIsQrOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Mostrar Código QR para móvil"
              aria-label="Código QR"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">QR</span>
            </button>
          )}

          {/* Spy Mode / Hold to Reveal Toggle */}
          <button
            onClick={handleToggleSpyMode}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all flex items-center gap-1 text-xs font-semibold ${
              isSpyMode
                ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-400 shadow-sm'
                : 'bg-neutral-800 hover:bg-neutral-750 border-transparent text-neutral-400 hover:text-white'
            }`}
            title={
              isSpyMode
                ? 'Modo Espía ACTIVO (mensajes difuminados, mantener presionado para leer)'
                : 'Activar Modo Espía (anti-captura y hombro: difumina mensajes hasta mantener presionado)'
            }
            aria-label="Alternar Modo Espía"
          >
            {isSpyMode ? (
              <EyeOff className="w-4 h-4 text-emerald-400" />
            ) : (
              <Eye className="w-4 h-4 text-neutral-400" />
            )}
            <span className="hidden md:inline">Espía</span>
          </button>

          {/* Sound Synthesizer Mute Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
            title={isMuted ? 'Activar efectos de sonido' : 'Silenciar efectos de sonido'}
            aria-label="Alternar sonidos"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-neutral-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Share Direct Link */}
          {roomKeyBase64 && (
            <button
              onClick={handleShareLink}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              title="Copiar enlace seguro con clave en hash fragment"
              aria-label="Compartir enlace seguro de la sala"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 text-xs">Copiado</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Enlace</span>
                </>
              )}
            </button>
          )}

          {/* Panic / Nuke Button */}
          <button
            onClick={onNuke}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800/80 text-red-300 hover:text-red-100 text-xs font-semibold transition-all shadow-sm group"
            title="Botón de Pánico: Destruir sala, cerrar conexión y limpiar RAM inmediatamente (o presiona Esc x 3)"
            aria-label="Pánico: Destruir sala"
          >
            <Flame className="w-3.5 h-3.5 text-red-400 group-hover:animate-bounce" />
            <span className="hidden lg:inline">Pánico</span>
          </button>

          {/* Leave Button */}
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold transition-colors"
            title="Salir de la sala"
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
          isSasVerified={isSasVerified}
          onOpenSasModal={onOpenSasModal}
        />

        {/* SAS Unverified Warning Banner when peers exist */}
        {participantCount > 1 && !isSasVerified && (
          <div
            role="alert"
            className="p-2.5 bg-amber-950/60 border border-amber-600/70 rounded-xl text-xs text-amber-200 flex items-center justify-between gap-3 shadow-md"
          >
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
              <span>
                <strong>Verificación Anti-MITM requerida:</strong> Compara el código SAS de 4 palabras con tu interlocutor antes de comenzar a escribir.
              </span>
            </div>
            <button
              onClick={onOpenSasModal}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shrink-0 transition-colors"
            >
              Verificar Código
            </button>
          </div>
        )}

        {/* Reconnection status badge */}
        {status === 'reconnecting' && (
          <div
            role="status"
            className="p-2.5 bg-amber-950/50 border border-amber-800/70 rounded-xl text-xs text-amber-300 flex items-center gap-2 shadow-sm animate-pulse"
          >
            <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <span>Reconectando automáticamente con el relay blindado...</span>
          </div>
        )}

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
        onPurgeMessage={onPurgeMessage}
        onLoadMedia={onLoadMedia}
        onOpenLightbox={(url, name) => setLightboxImage({ url, name })}
        isPeerTyping={isPeerTyping}
        isSpyMode={isSpyMode}
      />

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onSendFile={onSendFile}
        onSendAudio={onSendAudio}
        onTyping={onTyping}
        disabled={
          status !== 'connected' ||
          isHandshaking ||
          !fingerprint ||
          (!isSasVerified && participantCount > 1)
        }
      />
    </div>
  );
};
