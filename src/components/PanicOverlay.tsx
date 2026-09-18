import React from 'react';
import { EyeOff, ShieldAlert } from 'lucide-react';

interface PanicOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export const PanicOverlay: React.FC<PanicOverlayProps> = ({ isVisible, onDismiss }) => {
  if (!isVisible) return null;

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-[100] bg-neutral-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer animate-fade-in"
      role="alert"
      aria-label="Pantalla bloqueada por privacidad"
    >
      <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 mb-4 shadow-2xl">
        <EyeOff className="w-8 h-8 animate-pulse" />
      </div>

      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-amber-400" />
        <span>Contenido Oculto por Privacidad</span>
      </h2>

      <p className="text-xs text-neutral-400 max-w-sm mb-6 leading-relaxed">
        La ventana perdió el foco o se detectó un cambio de aplicación. La conversación se oculta automáticamente para impedir miradas indiscretas y capturas en el selector de tareas.
      </p>

      <span className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-200 transition-colors">
        Haz clic en cualquier parte para continuar
      </span>
    </div>
  );
};
