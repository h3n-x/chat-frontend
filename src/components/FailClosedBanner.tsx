import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const FailClosedBanner: React.FC = () => {
  return (
    <main
      role="alert"
      aria-live="assertive"
      className="min-h-screen flex items-center justify-center p-4 bg-neutral-950 text-neutral-100"
    >
      <div className="max-w-md w-full bg-red-950/40 border border-red-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-sm text-center">
        <div className="w-14 h-14 rounded-full bg-red-900/60 border border-red-700/50 flex items-center justify-center mx-auto mb-4 text-red-300">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-red-200 mb-2">
          Error Crítico de Seguridad (Fail-Closed)
        </h1>
        <p className="text-sm text-red-300/90 leading-relaxed mb-4">
          Tu navegador o el contexto de conexión actual no dispone de la API nativa{' '}
          <code className="bg-red-900/60 px-1.5 py-0.5 rounded text-xs font-mono">
            window.crypto.subtle
          </code>
          .
        </p>
        <div className="text-xs text-neutral-400 bg-neutral-900/80 p-3 rounded-lg border border-neutral-800 text-left mb-4">
          <p className="font-semibold text-neutral-300 mb-1">Causas comunes:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Conexión HTTP no segura (se requiere HTTPS o localhost).</li>
            <li>Navegador desactualizado o modo de aislamiento estricto.</li>
          </ul>
        </div>
        <p className="text-xs text-neutral-400">
          Por política estricta de seguridad, este cliente no operará en modo degradado ni
          utilizará primitivas criptográficas débiles.
        </p>
      </div>
    </main>
  );
};
