import React from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, Copy, Check } from 'lucide-react';

interface SasVerificationModalProps {
  fingerprint: string;
  isOpen: boolean;
  onConfirmMatch: () => void;
  onRejectMatch: () => void;
}

export const SasVerificationModal: React.FC<SasVerificationModalProps> = ({
  fingerprint,
  isOpen,
  onConfirmMatch,
  onRejectMatch,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !fingerprint) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const words = fingerprint.split('-');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sas-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-neutral-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-700/50 flex items-center justify-center text-amber-400 shrink-0">
            <KeyRound className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 id="sas-modal-title" className="text-base font-bold text-neutral-100">
              Verificación Anti-MITM (SAS)
            </h2>
            <p className="text-xs text-neutral-400">
              Protección criptográfica contra ataques Man-in-the-Middle
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="text-xs text-neutral-300 leading-relaxed bg-neutral-950 p-3.5 rounded-xl border border-neutral-800/80">
          <p className="mb-2">
            Compara este código de 4 palabras con tu interlocutor por un <strong>canal fuera de banda</strong> (ej. llamada de voz o en persona):
          </p>
          <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-800 font-mono text-sm tracking-wider text-emerald-400 font-bold">
            <div className="flex flex-wrap gap-1.5">
              {words.map((w, idx) => (
                <span key={idx} className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 text-xs">
                  {w}
                </span>
              ))}
            </div>
            <button
              onClick={handleCopy}
              className="ml-2 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
              title="Copiar código SAS"
              aria-label="Copiar código SAS"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">
            Si ambos ven exactamente las mismas palabras, está garantizado matemáticamente que ningún intermediario está interviniendo la sesión.
          </p>
        </div>

        {/* Decision Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            onClick={onConfirmMatch}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-semibold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-md"
          >
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>Coinciden — Activar Chat</span>
          </button>
          <button
            onClick={onRejectMatch}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 text-red-300 font-semibold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <ShieldAlert className="w-4 h-4" aria-hidden="true" />
            <span>No Coinciden — Abortar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
