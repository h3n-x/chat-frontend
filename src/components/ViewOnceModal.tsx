import React, { useState, useEffect } from 'react';
import { Eye, Flame, ShieldAlert, X } from 'lucide-react';

interface ViewOnceModalProps {
  isOpen: boolean;
  mediaUrl: string;
  mimeType: string;
  onClose: () => void;
  onPermanentBurn: () => void;
}

const VIEW_ONCE_DURATION_SEC = 7;

export const ViewOnceModal: React.FC<ViewOnceModalProps> = ({
  isOpen,
  mediaUrl,
  mimeType,
  onClose,
  onPermanentBurn,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(VIEW_ONCE_DURATION_SEC);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(VIEW_ONCE_DURATION_SEC);
      return;
    }

    setSecondsLeft(VIEW_ONCE_DURATION_SEC);

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          onPermanentBurn();
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isOpen, onClose, onPermanentBurn]);

  if (!isOpen) return null;

  const isImage = mimeType.startsWith('image/');
  const isAudio = mimeType.startsWith('audio/');

  const handleManualClose = () => {
    onPermanentBurn();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl select-none"
    >
      <div className="relative max-w-2xl w-full flex flex-col items-center">
        {/* Header with countdown badge and warning */}
        <div className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-2xl mb-4 shadow-xl">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                Contenido Efímero: Ver Una Sola Vez
              </p>
              <p className="text-[10px] text-neutral-400">
                Se autodestruirá permanentemente de la memoria al expirar
              </p>
            </div>
          </div>

          {/* Countdown timer pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-red-950/80 border border-red-500/80 px-3 py-1 rounded-xl shadow-inner">
              <Flame className="w-4 h-4 text-red-400 animate-bounce" />
              <span className="font-mono font-bold text-sm text-red-200">
                00:0{secondsLeft}s
              </span>
            </div>
            <button
              onClick={handleManualClose}
              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
              title="Cerrar y autodestruir inmediatamente"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Media Container */}
        <div className="w-full bg-neutral-950 border border-neutral-800 rounded-3xl p-4 flex flex-col items-center justify-center min-h-[300px] max-h-[70vh] overflow-hidden shadow-2xl relative">
          {isImage && (
            <img
              src={mediaUrl}
              alt="Contenido efímero ver una sola vez"
              className="max-h-[60vh] max-w-full object-contain rounded-2xl pointer-events-none"
              draggable={false}
            />
          )}

          {isAudio && (
            <div className="w-full flex flex-col items-center gap-4 py-8">
              <audio
                src={mediaUrl}
                controls
                autoPlay
                className="w-full max-w-md accent-emerald-500"
              />
              <p className="text-xs text-neutral-400 font-mono">
                Reproduciendo audio efímero...
              </p>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-neutral-400">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Anti-Forense: El Blob será revocado irreversiblemente en RAM.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
