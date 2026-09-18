import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Copy, Check, Users, KeyRound } from 'lucide-react';

interface SecurityBadgeProps {
  fingerprint: string;
  participantCount: number;
  isSasVerified: boolean;
  onOpenSasModal: () => void;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  fingerprint,
  participantCount,
  isSasVerified,
  onOpenSasModal,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!fingerprint) return;
    navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      aria-label="Panel de Seguridad Criptográfica"
      className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 text-xs backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-inner"
    >
      {/* Encryption Details */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span>E2EE: AES-256-GCM</span>
        </span>
        <span className="text-neutral-400 hidden sm:inline">•</span>
        <span className="text-neutral-400 hidden sm:inline">Cero-Persistencia</span>
      </div>

      {/* SAS Fingerprint & MITM Verification */}
      {fingerprint && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 px-2.5 py-1 rounded-md text-neutral-300">
            <KeyRound className="w-3 h-3 text-amber-400" aria-hidden="true" />
            <span className="font-mono text-[11px] tracking-wider text-neutral-200">
              {fingerprint}
            </span>
            <button
              onClick={handleCopy}
              className="ml-1 text-neutral-400 hover:text-neutral-200 transition-colors p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
              title="Copiar código de verificación SAS"
              aria-label="Copiar código de verificación SAS"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>

          <button
            onClick={onOpenSasModal}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all border ${
              isSasVerified
                ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-700/60 text-emerald-300'
                : 'bg-amber-950/50 hover:bg-amber-900/60 border-amber-600/70 text-amber-300 animate-pulse'
            }`}
            title={
              isSasVerified
                ? 'SAS verificado. Clic para re-verificar.'
                : 'Verificación SAS pendiente. Clic para comparar y verificar.'
            }
          >
            {isSasVerified ? (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>SAS Verificado</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                <span>Verificar SAS</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Live Peer Count */}
      <div className="flex items-center gap-1.5 text-neutral-400 bg-neutral-950/60 px-2 py-1 rounded-md border border-neutral-800/80">
        <Users className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
        <span>
          {participantCount} {participantCount === 1 ? 'participante' : 'participantes'}
        </span>
      </div>
    </section>
  );
};
