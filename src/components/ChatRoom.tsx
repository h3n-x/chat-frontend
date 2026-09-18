import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut,
  AlertCircle,
  Loader2,
  KeyRound,
  QrCode,
  Volume2,
  VolumeX,
  Flame,
  Eye,
  EyeOff,
  Radio,
  Search,
  X,
} from 'lucide-react';
import { SecurityBadge } from './SecurityBadge';
import { SasVerificationModal } from './SasVerificationModal';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { QrCodeModal } from './QrCodeModal';
import { ImageLightboxModal } from './ImageLightboxModal';
import { PanicOverlay } from './PanicOverlay';
import { NukeModal } from './NukeModal';
import { ViewOnceModal } from './ViewOnceModal';
import { SteganographyModal } from './SteganographyModal';
import { TorSettingsModal } from './TorSettingsModal';
import { isSoundMuted, toggleSoundMuted } from '../utils/audio';
import { VoiceEffect } from '../utils/voiceScrambler';
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
  isDecoyTrafficActive: boolean;
  rttMs?: number | null;
  identity: { name: string; color: string };
  messages: ChatMessage[];
  onSendMessage: (text: string, burnTtl?: number) => Promise<void>;
  onSendFile: (file: File, isViewOnce?: boolean) => Promise<void>;
  onSendAudio: (blob: Blob, durationSec: number, effect?: VoiceEffect) => Promise<void>;
  onDownloadFile: (fileId: string, fileName: string, mimeType: string) => Promise<void>;
  onLoadMedia: (fileId: string, mimeType: string, messageId: string) => Promise<void>;
  onPurgeMessage: (id: string) => void;
  onTyping: (isTyping: boolean) => void;
  onToggleDecoyTraffic: () => void;
  onReact: (messageId: string, emoji: string) => void;
  onBurnViewOnce: (messageId: string) => void;
  onSendStegoImage: (stegoBlob: Blob, previewUrl: string, secretText: string) => Promise<void>;
  onDuress: () => void;
  onLeave: () => void;
  onNuke: () => void;
  onRemoteNuke: () => Promise<void>;
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
  isDecoyTrafficActive,
  rttMs,
  identity,
  messages,
  onSendMessage,
  onSendFile,
  onSendAudio,
  onDownloadFile,
  onLoadMedia,
  onPurgeMessage,
  onTyping,
  onToggleDecoyTraffic,
  onReact,
  onBurnViewOnce,
  onSendStegoImage,
  onDuress,
  onLeave,
  onNuke,
  onRemoteNuke,
  onConfirmSasMatch,
  onRejectSasMatch,
  onOpenSasModal,
}) => {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(isSoundMuted());
  const [isBlurred, setIsBlurred] = useState(false);
  const [isNukeModalOpen, setIsNukeModalOpen] = useState(false);
  const [isStegoOpen, setIsStegoOpen] = useState(false);
  const [isTorSettingsOpen, setIsTorSettingsOpen] = useState(false);
  const [viewOnceData, setViewOnceData] = useState<{ url: string; mime: string; messageId: string } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

  // Esc x 3 Panic shortcut detector
  const escCountRef = useRef<number>(0);
  const escTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Duress hotkey: Ctrl + Shift + D
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        onDuress();
        return;
      }

      // Search hotkey: Ctrl + F
      if (e.ctrlKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

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

  const displayMessages = searchQuery.trim()
    ? messages.filter(
        (m) =>
          m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.file?.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.stego_hidden_text &&
            m.stego_hidden_text.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : messages;

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
        roomKeyBase64={roomKeyBase64}
      />

      {/* Steganography LSB Modal */}
      <SteganographyModal
        isOpen={isStegoOpen}
        onClose={() => setIsStegoOpen(false)}
        onSendStegoImage={onSendStegoImage}
      />

      {/* View-Once Ephemeral Modal */}
      <ViewOnceModal
        isOpen={!!viewOnceData}
        mediaUrl={viewOnceData?.url || ''}
        mimeType={viewOnceData?.mime || ''}
        onClose={() => setViewOnceData(null)}
        onPermanentBurn={() => {
          if (viewOnceData) {
            onBurnViewOnce(viewOnceData.messageId);
            setViewOnceData(null);
          }
        }}
      />

      {/* Tor & Onion Proxy Settings Modal */}
      <TorSettingsModal
        isOpen={isTorSettingsOpen}
        onClose={() => setIsTorSettingsOpen(false)}
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

      {/* Collective / Local Nuke Modal */}
      <NukeModal
        isOpen={isNukeModalOpen}
        onClose={() => setIsNukeModalOpen(false)}
        onLocalNuke={onNuke}
        onRemoteNuke={onRemoteNuke}
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
              title="Mostrar Código QR / Frase BIP-39"
              aria-label="Código QR"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Acceso</span>
            </button>
          )}

          {/* Search in RAM Button */}
          <button
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all flex items-center gap-1 text-xs font-semibold ${
              isSearchOpen || searchQuery
                ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-400 shadow-sm'
                : 'bg-neutral-800 hover:bg-neutral-750 border-transparent text-neutral-400 hover:text-white'
            }`}
            title="Buscar en memoria RAM (Ctrl + F)"
            aria-label="Buscar mensajes"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">Buscar</span>
          </button>

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

          {/* Decoy Traffic / Camouflage Toggle */}
          <button
            onClick={onToggleDecoyTraffic}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all flex items-center gap-1 text-xs font-semibold ${
              isDecoyTrafficActive
                ? 'bg-amber-950/80 border-amber-500/70 text-amber-400 shadow-sm'
                : 'bg-neutral-800 hover:bg-neutral-750 border-transparent text-neutral-400 hover:text-white'
            }`}
            title={
              isDecoyTrafficActive
                ? 'Camuflaje de Tráfico ACTIVO: Generando paquetes señuelo cifrados periódicos para ofuscar pautas de tráfico'
                : 'Activar Camuflaje de Tráfico (envía tramas cifradas señuelo periódicas para derrotar análisis de tráfico)'
            }
            aria-label="Alternar camuflaje de tráfico señuelo"
          >
            <Radio className={`w-4 h-4 ${isDecoyTrafficActive ? 'animate-pulse text-amber-400' : 'text-neutral-400'}`} />
            <span className="hidden md:inline">Camuflaje</span>
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

          {/* Panic / Nuke Button */}
          <button
            onClick={() => setIsNukeModalOpen(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800/80 text-red-300 hover:text-red-100 text-xs font-semibold transition-all shadow-sm group"
            title="Botón de Pánico: Opciones de autodestrucción local o colectiva (o presiona Esc x 3 para nuke local)"
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

      {/* In-RAM Search Filter Bar */}
      {isSearchOpen && (
        <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center gap-2 animate-fade-in">
          <Search className="w-4 h-4 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar palabras o archivos en memoria RAM (Ctrl + F)..."
            autoFocus
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
          />
          {searchQuery && (
            <span className="text-[11px] text-emerald-400 font-mono">
              {displayMessages.length} resultado{displayMessages.length === 1 ? '' : 's'}
            </span>
          )}
          <button
            onClick={() => {
              setSearchQuery('');
              setIsSearchOpen(false);
            }}
            className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-header: Security & Status */}
      <div className="px-4 py-2 shrink-0 space-y-2">
        <SecurityBadge
          fingerprint={fingerprint}
          participantCount={participantCount}
          isSasVerified={isSasVerified}
          rttMs={rttMs}
          onOpenSasModal={onOpenSasModal}
          onOpenTorSettings={() => setIsTorSettingsOpen(true)}
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
        messages={displayMessages}
        onDownloadFile={onDownloadFile}
        onPurgeMessage={onPurgeMessage}
        onLoadMedia={onLoadMedia}
        onOpenLightbox={(url, name) => setLightboxImage({ url, name })}
        onReact={onReact}
        onOpenViewOnce={(url, mime, id) => setViewOnceData({ url, mime, messageId: id })}
        searchQuery={searchQuery}
        isPeerTyping={isPeerTyping}
        isSpyMode={isSpyMode}
      />

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onSendFile={onSendFile}
        onSendAudio={onSendAudio}
        onTyping={onTyping}
        onOpenSteganography={() => setIsStegoOpen(true)}
        onDuress={onDuress}
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
