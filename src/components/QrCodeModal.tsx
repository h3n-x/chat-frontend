import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Copy, Check, ShieldCheck, KeyRound } from 'lucide-react';
import { copyWithAutoScrub } from '../utils/secureClipboard';
import { base64KeyToMnemonic } from '../utils/bip39';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteUrl: string;
  roomId: string;
  roomKeyBase64?: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  inviteUrl,
  roomId,
  roomKeyBase64,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'bip39'>('qr');
  const [qrSvg, setQrSvg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedBip, setCopiedBip] = useState<boolean>(false);
  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);

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

    if (roomKeyBase64) {
      base64KeyToMnemonic(roomKeyBase64)
        .then((m) => setMnemonicWords(m.split(' ')))
        .catch((err) => console.error('Error generating BIP-39 mnemonic:', err));
    }
  }, [isOpen, inviteUrl, roomKeyBase64]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const ok = await copyWithAutoScrub(inviteUrl, 30);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyBip = async () => {
    if (mnemonicWords.length === 0) return;
    const phrase = mnemonicWords.join(' ');
    const ok = await copyWithAutoScrub(phrase, 30);
    if (ok) {
      setCopiedBip(true);
      setTimeout(() => setCopiedBip(false), 2000);
    }
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
            Compartir Acceso a la Sala
          </h3>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-xl w-full">
          <button
            onClick={() => setActiveTab('qr')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'qr'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Código QR Móvil
          </button>
          <button
            onClick={() => setActiveTab('bip39')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'bip39'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Frase BIP-39</span>
          </button>
        </div>

        {activeTab === 'qr' ? (
          <>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Escanea este código con la cámara de tu teléfono para entrar a la sala sin enviar el enlace por canales inseguros.
            </p>

            {/* QR Code Container */}
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
              <span>Generado en la memoria RAM del navegador. Ningún dato viaja a servidores.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex w-full gap-2 pt-1">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition-all border border-neutral-700"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '¡Copiado (Auto-Scrub)!' : 'Copiar Enlace Seguro'}</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
              >
                Listo
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Clave de 256 bits codificada como 24 palabras mnemónicas estándar BIP-39 con checksum SHA-256. Ideal para dictar por voz o anotar en papel.
            </p>

            {/* BIP-39 24 words grid */}
            <div className="w-full max-h-56 overflow-y-auto grid grid-cols-3 gap-1.5 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-left">
              {mnemonicWords.map((word, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-neutral-900 border border-neutral-800/80 px-2 py-1 rounded-lg text-[11px] font-mono"
                >
                  <span className="text-neutral-500 text-[10px] w-4">{idx + 1}.</span>
                  <span className="text-emerald-300 font-semibold truncate">{word}</span>
                </div>
              ))}
            </div>

            {/* Room ID Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700 text-xs text-neutral-300 font-mono">
              <span>Sala:</span>
              <span className="font-bold text-emerald-400 tracking-wider">{roomId}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex w-full gap-2 pt-1">
              <button
                onClick={handleCopyBip}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition-all border border-neutral-700"
              >
                {copiedBip ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedBip ? '¡Copiado (Auto-Scrub 30s)!' : 'Copiar 24 Palabras'}</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
              >
                Listo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
