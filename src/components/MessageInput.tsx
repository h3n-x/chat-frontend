import React, { useState, useRef } from 'react';
import { Send, Paperclip, Loader2, AlertCircle, Mic, Flame, Eye, Image as ImageIcon } from 'lucide-react';
import { MAX_MESSAGE_LENGTH, MAX_FILE_SIZE_BYTES } from '../config';
import { VoiceRecorder } from './VoiceRecorder';
import { VoiceEffect } from '../utils/voiceScrambler';

interface MessageInputProps {
  onSendMessage: (text: string, burnTtl?: number) => Promise<void>;
  onSendFile: (file: File, isViewOnce?: boolean) => Promise<void>;
  onSendAudio: (blob: Blob, durationSec: number, effect?: VoiceEffect) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  onOpenSteganography?: () => void;
  onDuress?: () => void;
  disabled: boolean;
}

const BURN_OPTIONS = [
  { label: 'Off', ttl: 0, title: 'Mensaje permanente en RAM' },
  { label: '10s', ttl: 10, title: 'Autodestrucción en 10 segundos' },
  { label: '30s', ttl: 30, title: 'Autodestrucción en 30 segundos' },
  { label: '1m', ttl: 60, title: 'Autodestrucción en 1 minuto' },
  { label: '5m', ttl: 300, title: 'Autodestrucción en 5 minutos' },
];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onSendFile,
  onSendAudio,
  onTyping,
  onOpenSteganography,
  onDuress,
  disabled,
}) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [burnIndex, setBurnIndex] = useState<number>(0);
  const [isViewOnce, setIsViewOnce] = useState<boolean>(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedBurn = BURN_OPTIONS[burnIndex]!;

  const handleCycleBurnTtl = () => {
    setBurnIndex((prev) => (prev + 1) % BURN_OPTIONS.length);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || sending || disabled) return;

    // Check for Duress emergency code
    if (text.trim().toLowerCase() === '/duress' || text.trim() === '9999') {
      if (onDuress) {
        setText('');
        onDuress();
        return;
      }
    }

    setSending(true);
    setInputError(null);
    onTyping(false);
    try {
      await onSendMessage(text, selectedBurn.ttl > 0 ? selectedBurn.ttl : undefined);
      setText('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar mensaje';
      setInputError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_MESSAGE_LENGTH);
    setText(val);
    if (val.trim()) {
      onTyping(true);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]!;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setInputError('El archivo seleccionado supera el límite de 15 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileUploading(true);
    setInputError(null);
    try {
      await onSendFile(file, isViewOnce);
      setIsViewOnce(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al subir archivo';
      setInputError(msg);
    } finally {
      setFileUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <footer className="p-3 sm:p-4 bg-neutral-900/80 border-t border-neutral-800 backdrop-blur-md">
      {inputError && (
        <div
          role="alert"
          className="mb-2 p-2 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
          <span>{inputError}</span>
        </div>
      )}

      {isRecordingAudio ? (
        <VoiceRecorder
          onSendAudio={async (blob, duration, effect) => {
            try {
              setInputError(null);
              await onSendAudio(blob, duration, effect);
              setIsRecordingAudio(false);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Error al enviar nota de voz';
              setInputError(msg);
            }
          }}
          onCancel={() => setIsRecordingAudio(false)}
        />
      ) : (
        <form onSubmit={handleSend} className="flex items-end gap-2">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="chat-file-upload"
            disabled={disabled || fileUploading}
          />

          {/* Attachment Button */}
          <label
            htmlFor="chat-file-upload"
            className={`p-2.5 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-emerald-500 shrink-0 flex items-center justify-center ${
              disabled || fileUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Adjuntar archivo o imagen cifrada (máx. 15MB)"
            aria-label="Adjuntar archivo o imagen cifrada (máx. 15MB)"
          >
            {fileUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </label>

          {/* Steganography LSB Button */}
          {onOpenSteganography && (
            <button
              type="button"
              onClick={onOpenSteganography}
              disabled={disabled || fileUploading || sending}
              className={`p-2.5 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-indigo-400 transition-colors shrink-0 flex items-center justify-center ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Esteganografía: Ocultar texto confidencial dentro de una imagen portadora"
              aria-label="Esteganografía LSB"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          )}

          {/* View-Once Toggle Button */}
          <button
            type="button"
            onClick={() => setIsViewOnce((prev) => !prev)}
            disabled={disabled || fileUploading || sending}
            className={`px-2 py-2.5 rounded-xl border text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
              isViewOnce
                ? 'bg-amber-950/80 border-amber-500/80 text-amber-400 shadow-sm'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title={
              isViewOnce
                ? 'Modo Ver 1 sola vez ACTIVO: El próximo archivo adjunto se destruirá permanentemente tras 7s'
                : 'Activar Ver 1 sola vez: El archivo adjunto se destruye permanentemente tras abrirse'
            }
            aria-label="Alternar Ver 1 sola vez"
          >
            <Eye className={`w-4 h-4 ${isViewOnce ? 'animate-pulse text-amber-400' : 'text-neutral-500'}`} />
            <span>1x</span>
          </button>

          {/* Voice Note Button */}
          <button
            type="button"
            onClick={() => setIsRecordingAudio(true)}
            disabled={disabled || fileUploading || sending}
            className={`p-2.5 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors shrink-0 flex items-center justify-center ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Grabar nota de voz cifrada E2EE"
            aria-label="Grabar nota de voz cifrada"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Burn-after-reading TTL Cycle Toggle */}
          <button
            type="button"
            onClick={handleCycleBurnTtl}
            disabled={disabled}
            className={`px-2 py-2.5 rounded-xl border text-xs font-mono font-medium transition-all shrink-0 flex items-center gap-1 ${
              selectedBurn.ttl > 0
                ? 'bg-amber-950/70 border-amber-600/80 text-amber-400 shadow-sm'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title={selectedBurn.title}
            aria-label="Configurar temporizador de autodestrucción"
          >
            <Flame
              className={`w-4 h-4 ${
                selectedBurn.ttl > 0 ? 'text-amber-400 fill-amber-400/20' : 'text-neutral-500'
              }`}
            />
            <span>{selectedBurn.label}</span>
          </button>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={
                disabled
                  ? 'Conectando a la sala...'
                  : selectedBurn.ttl > 0
                  ? `Mensaje con autodestrucción (${selectedBurn.label})...`
                  : 'Escribe un mensaje seguro (Enter para enviar)...'
              }
              disabled={disabled || sending}
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              aria-label="Mensaje seguro"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none disabled:opacity-50 transition-all max-h-32"
            />
            {text.length > 1500 && (
              <span className="absolute right-3 bottom-2 text-[10px] text-neutral-400 font-mono">
                {text.length}/{MAX_MESSAGE_LENGTH}
              </span>
            )}
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={disabled || sending || !text.trim()}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-neutral-950 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 shrink-0"
            title="Enviar mensaje cifrado"
            aria-label="Enviar mensaje cifrado"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-neutral-950" />
            )}
          </button>
        </form>
      )}
    </footer>
  );
};
