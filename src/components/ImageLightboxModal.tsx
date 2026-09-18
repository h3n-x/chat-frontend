import React from 'react';
import { X, Download, ShieldCheck } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageName,
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Previsualización de imagen cifrada"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center gap-3 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between w-full px-2 text-white">
          <div className="flex items-center gap-2 text-xs text-neutral-300 truncate max-w-xs sm:max-w-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate font-medium">{imageName}</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download={imageName}
              className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5 text-xs font-semibold px-2.5"
              title="Descargar imagen a disco"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Guardar</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              aria-label="Cerrar visor de imagen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image preview in memory */}
        <div className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex items-center justify-center max-h-[80vh] shadow-2xl">
          <img
            src={imageUrl}
            alt={imageName}
            className="max-h-[80vh] max-w-full object-contain select-none"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>
    </div>
  );
};
