import React from 'react';
import { X, Flame, Bomb, LogOut, ShieldAlert } from 'lucide-react';

interface NukeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocalNuke: () => void;
  onRemoteNuke: () => Promise<void>;
}

export const NukeModal: React.FC<NukeModalProps> = ({
  isOpen,
  onClose,
  onLocalNuke,
  onRemoteNuke,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nuke-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-neutral-900 border border-red-800/80 p-6 shadow-2xl flex flex-col gap-4 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 text-red-400">
          <div className="p-2 rounded-xl bg-red-950/80 border border-red-800/80">
            <Flame className="w-6 h-6 text-red-500 animate-pulse" />
          </div>
          <div>
            <h3 id="nuke-modal-title" className="text-base font-bold text-white">
              Protocolo de Pánico & Autodestrucción
            </h3>
            <p className="text-xs text-neutral-400">
              Selecciona el alcance del purgado de memoria volátil:
            </p>
          </div>
        </div>

        <div className="p-3 bg-red-950/30 border border-red-900/60 rounded-xl text-xs text-red-300 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>
            Esta acción es irreversible. Se destruirán las claves simétricas en RAM, se revocarán todos los Blobs y se limpiará el historial de sesión.
          </span>
        </div>

        {/* Options */}
        <div className="space-y-2.5 pt-1">
          {/* Option 1: Collective Kill Switch */}
          <button
            type="button"
            onClick={async () => {
              onClose();
              await onRemoteNuke();
            }}
            className="w-full flex items-start gap-3 p-3.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-700/80 text-left transition-all group"
          >
            <Bomb className="w-5 h-5 text-red-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-red-200 group-hover:text-white">
                💣 Destrucción Colectiva (Nuke para Todos)
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                Transmite una señal criptográfica de autodestrucción inmediata a todos los participantes en la sala y purga tu navegador.
              </p>
            </div>
          </button>

          {/* Option 2: Local Panic Nuke */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onLocalNuke();
            }}
            className="w-full flex items-start gap-3 p-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-left transition-all group"
          >
            <LogOut className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-neutral-200 group-hover:text-white">
                🏃 Salida Local Inmediata (Solo Mi Dispositivo)
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                Destruye la sesión y claves solo en tu equipo de forma silenciosa, cerrando el WebSocket y redirigiendo a la raíz.
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
