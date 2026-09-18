import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Copy, Check, ShieldCheck } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteUrl: string;
  roomId: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  inviteUrl,
  roomId,
}) => {
  const [qrSvg, setQrSvg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !inviteUrl) return;

    QRCode.toString(inviteUrl, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((svg) => setQrSvg(svg))
      .catch((err) => console.error('Error generating QR code SVG:', err));
  }, [isOpen, inviteUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl flex flex-col items-center gap-4 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label="Cerrar modal de código QR"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-emerald-400">
          <QrCode className="w-5 h-5" />
          <h3 id="qr-modal-title" className="text-base font-bold text-white">
            Unirse desde el Móvil
          </h3>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          Escanea este código con la cámara de tu teléfono para entrar a la sala sin enviar el enlace por canales inseguros.
        </p>

        {/* QR Code Container (White background for scanner contrast) */}
        <div className="p-3 bg-white rounded-xl shadow-inner flex items-center justify-center w-[220px] h-[220px]">
          {qrSvg ? (
            <div
              className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          ) : (
            <span className="text-xs text-neutral-500 font-mono">Generando QR...</span>
          )}
        </div>

        {/* Room ID Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700 text-xs text-neutral-300 font-mono">
          <span>Sala:</span>
          <span className="font-bold text-emerald-400 tracking-wider">{roomId}</span>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 bg-neutral-950/60 px-3 py-2 rounded-lg border border-neutral-800/80 w-full text-left">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Generado 100% en la memoria RAM del navegador. Ningún dato viaja a servidores de terceros.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full gap-2 pt-1">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition-all border border-neutral-700"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
