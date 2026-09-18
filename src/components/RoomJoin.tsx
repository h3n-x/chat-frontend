import React, { useState } from 'react';
import { Shield, Plus, ArrowRight, Loader2, Lock, EyeOff, HardDriveDownload } from 'lucide-react';

interface RoomJoinProps {
  onCreateRoom: () => Promise<void>;
  onJoinByCode: (code: string) => Promise<void>;
}

export const RoomJoin: React.FC<RoomJoinProps> = ({
  onCreateRoom,
  onJoinByCode,
}) => {
  const [code, setCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      await onCreateRoom();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la sala';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setJoining(true);
    setError(null);
    try {
      await onJoinByCode(cleanCode);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al unirse a la sala';
      setError(msg);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto px-4 py-8">
      {/* Header */}
      <header className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-xl shadow-emerald-950/40">
          <Shield className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-100 sm:text-4xl">
          Chat Anónimo <span className="text-emerald-400 font-mono text-xl ml-1">v2.0</span>
        </h1>
        <p className="mt-2 text-sm text-neutral-400 max-w-md mx-auto">
          Mensajería efímera de extremo a extremo (E2EE) con arquitectura{' '}
          <strong className="text-neutral-300 font-medium">Zero-Knowledge Blind Relay</strong>.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-300 text-center"
        >
          {error}
        </div>
      )}

      {/* Action Cards */}
      <div className="space-y-4">
        {/* Create Room Button */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 backdrop-blur-sm">
          <h2 className="text-base font-semibold text-neutral-200 mb-1">
            Iniciar una conversación nueva
          </h2>
          <p className="text-xs text-neutral-400 mb-4">
            Genera una sala efímera y una clave de 256 bits única en la memoria de tu navegador.
          </p>
          <button
            onClick={handleCreate}
            disabled={creating || joining}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-neutral-950 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-neutral-950 shadow-lg shadow-emerald-950/50"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando claves criptográficas...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Crear Sala Privada</span>
              </>
            )}
          </button>
        </div>

        {/* Join by Code Form */}
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 backdrop-blur-sm">
          <h2 className="text-base font-semibold text-neutral-200 mb-1">
            Unirse a una sala existente
          </h2>
          <p className="text-xs text-neutral-400 mb-4">
            Ingresa el código de 6 caracteres. Se realizará un intercambio de claves seguro
            vía ECDH.
          </p>
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: K7M9P2"
              maxLength={16}
              disabled={creating || joining}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider text-neutral-100 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
              aria-label="Código de la sala"
            />
            <button
              type="submit"
              disabled={creating || joining || !code.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-100 font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {joining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Unirse</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Security Principles Showcase */}
      <footer className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs text-neutral-400">
        <div className="bg-neutral-900/40 border border-neutral-800/60 p-3 rounded-xl">
          <Lock className="w-4 h-4 text-emerald-400 mb-1.5" aria-hidden="true" />
          <h3 className="font-semibold text-neutral-300">Cifrado Nativo</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
            AES-256-GCM y ECDH ejecutados con WebCrypto API del navegador.
          </p>
        </div>
        <div className="bg-neutral-900/40 border border-neutral-800/60 p-3 rounded-xl">
          <EyeOff className="w-4 h-4 text-emerald-400 mb-1.5" aria-hidden="true" />
          <h3 className="font-semibold text-neutral-300">Blind Relay</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
            El servidor enruta paquetes cifrados sin poseer claves ni descifrar nada.
          </p>
        </div>
        <div className="bg-neutral-900/40 border border-neutral-800/60 p-3 rounded-xl">
          <HardDriveDownload className="w-4 h-4 text-emerald-400 mb-1.5" aria-hidden="true" />
          <h3 className="font-semibold text-neutral-300">Zero-Persistence</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
            Nada se guarda en bases de datos ni en localStorage. Todo es volátil.
          </p>
        </div>
      </footer>
    </div>
  );
};
