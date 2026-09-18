import React, { useState, useRef } from 'react';
import { Shield, Eye, Lock, Copy, Check, X, FileImage, Loader2 } from 'lucide-react';
import { encodeLsbMessage, decodeLsbMessage } from '../utils/steganography';
import { copyWithAutoScrub } from '../utils/secureClipboard';

interface SteganographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendStegoImage: (stegoBlob: Blob, previewUrl: string, secretText: string) => Promise<void>;
}

export const SteganographyModal: React.FC<SteganographyModalProps> = ({
  isOpen,
  onClose,
  onSendStegoImage,
}) => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [secretText, setSecretText] = useState('');
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP).');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setDecodedMessage(null);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleEncodeAndSend = async () => {
    if (!selectedFile || !secretText.trim()) return;

    setProcessing(true);
    setErrorMessage(null);

    try {
      const stegoBlob = await encodeLsbMessage(selectedFile, secretText.trim());
      const localUrl = URL.createObjectURL(stegoBlob);
      await onSendStegoImage(stegoBlob, localUrl, secretText.trim());
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar esteganografía';
      setErrorMessage(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecode = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setErrorMessage(null);
    setDecodedMessage(null);

    try {
      const extracted = await decodeLsbMessage(selectedFile);
      if (!extracted) {
        setErrorMessage('No se encontró ningún mensaje oculto con firma esteganográfica ZKST en esta imagen.');
      } else {
        setDecodedMessage(extracted);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al extraer esteganografía';
      setErrorMessage(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyDecoded = async () => {
    if (!decodedMessage) return;
    const ok = await copyWithAutoScrub(decodedMessage, 30);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setSecretText('');
    setDecodedMessage(null);
    setErrorMessage(null);
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
            <div className="p-2 rounded-2xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-100 flex items-center gap-1.5">
                Esteganografía LSB en Imágenes
              </h2>
              <p className="text-xs text-neutral-400">
                Oculta texto confidencial en los bits menos significativos (RGB)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-2xl">
          <button
            onClick={() => {
              setMode('encode');
              handleReset();
            }}
            className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
              mode === 'encode'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            🔒 Ocultar Mensaje
          </button>
          <button
            onClick={() => {
              setMode('decode');
              handleReset();
            }}
            className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
              mode === 'decode'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            🔍 Revelar Mensaje
          </button>
        </div>

        {/* File Picker Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-neutral-800 hover:border-indigo-500/60 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-neutral-950/50 hover:bg-neutral-950 transition-colors relative overflow-hidden"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {previewUrl ? (
            <div className="flex items-center gap-3 w-full">
              <img
                src={previewUrl}
                alt="Vista previa portadora"
                className="w-16 h-16 object-cover rounded-xl border border-neutral-800"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-neutral-200 truncate">
                  {selectedFile?.name}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {((selectedFile?.size || 0) / 1024).toFixed(1)} KB · Haz clic para cambiar imagen
                </p>
              </div>
            </div>
          ) : (
            <>
              <FileImage className="w-8 h-8 text-neutral-500" />
              <p className="text-xs text-neutral-300 font-medium text-center">
                Selecciona la imagen portadora (PNG recomendado)
              </p>
              <p className="text-[10px] text-neutral-400">
                La imagen viajará aparentemente normal para cualquier observador de red
              </p>
            </>
          )}
        </div>

        {/* Encode Mode Content */}
        {mode === 'encode' && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-300 mb-1 block">
                Texto secreto a incrustar en los píxeles:
              </label>
              <textarea
                value={secretText}
                onChange={(e) => setSecretText(e.target.value)}
                placeholder="Escribe el mensaje confidencial que será camuflado dentro de la imagen..."
                rows={3}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
              />
            </div>

            <button
              onClick={handleEncodeAndSend}
              disabled={!selectedFile || !secretText.trim() || processing}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Incrustando bits en canales RGB...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Incrustar y Transmitir Imagen Secreta</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Decode Mode Content */}
        {mode === 'decode' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDecode}
              disabled={!selectedFile || processing}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extrayendo payload de píxeles LSB...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Extraer Mensaje Oculto</span>
                </>
              )}
            </button>

            {decodedMessage && (
              <div className="p-3 bg-neutral-950 border border-emerald-500/40 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Mensaje Oculto Descifrado:
                  </span>
                  <button
                    onClick={handleCopyDecoded}
                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copiado (Auto-Scrub 30s)</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs font-mono text-neutral-100 bg-neutral-900/90 p-2 rounded-lg break-words select-text">
                  {decodedMessage}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-2.5 rounded-xl">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};
