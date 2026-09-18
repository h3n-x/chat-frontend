import React, { useState } from 'react';
import { Globe, Check, X, RefreshCw } from 'lucide-react';
import {
  detectNetworkPrivacy,
  getCustomRelayUrl,
  setCustomRelayUrl,
  NetworkPrivacyProfile,
} from '../utils/torDetection';

interface TorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TorSettingsModal: React.FC<TorSettingsModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<NetworkPrivacyProfile>(detectNetworkPrivacy);
  const [customEndpoint, setCustomEndpoint] = useState<string>(() => getCustomRelayUrl() || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setCustomRelayUrl(customEndpoint.trim() || null);
    setProfile(detectNetworkPrivacy());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefault = () => {
    setCustomRelayUrl(null);
    setCustomEndpoint('');
    setProfile(detectNetworkPrivacy());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-purple-950/80 border border-purple-500/50 text-purple-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-100 flex items-center gap-1.5">
                Red Tor & Configuración de Blind Relay
              </h2>
              <p className="text-xs text-neutral-400">
                Anonimato de capas de red y servicios ocultos .onion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Network Detection Status */}
        <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">Detección de Navegación:</span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                profile.isTorLikely
                  ? 'bg-purple-950 border border-purple-500/70 text-purple-300'
                  : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              {profile.isTorLikely ? '🧅 Entorno Tor / Modo Privacidad' : '🌐 Red Clearnet Estándar'}
            </span>
          </div>

          <p className="text-[11px] text-neutral-400 leading-relaxed">
            {profile.isTorLikely
              ? 'Tu navegador presenta características de ofuscación de huellas dactilares (Tor Browser / Brave Onion). Tu proveedor de internet no puede vincular tus paquetes de red con tu identidad física.'
              : 'Para resistencia máxima contra censura gubernamental y análisis de metadatos de red, recomendamos abrir este chat a través del navegador oficial Tor Browser.'}
          </p>
        </div>

        {/* Custom Relay URL */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-neutral-200 flex items-center justify-between">
            <span>Endpoint WebSocket Personalizado / Onion Relay:</span>
            {profile.isCustomRelay && (
              <span className="text-[10px] text-amber-400 font-mono">Relay Personalizado Activo</span>
            )}
          </label>
          <input
            type="text"
            value={customEndpoint}
            onChange={(e) => setCustomEndpoint(e.target.value)}
            placeholder="ws://ejemplo7f3k4v...onion/ws o ws://127.0.0.1:8000/ws"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-200 placeholder-neutral-500 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-[10px] text-neutral-400">
            Deja este campo vacío para usar el Blind Relay oficial por defecto. Si configuras un Onion Service, tus conexiones WebSocket viajarán cifradas de extremo a extremo dentro de los 3 saltos de la red Tor.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Configuración Guardada</span>
              </>
            ) : (
              <span>Guardar y Aplicar</span>
            )}
          </button>

          {profile.isCustomRelay && (
            <button
              onClick={handleResetDefault}
              className="px-3 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl transition-colors"
              title="Restaurar relay predeterminado"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
