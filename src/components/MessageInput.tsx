import React, { useState, useRef } from 'react';
import { Send, Paperclip, Loader2, AlertCircle } from 'lucide-react';
import { MAX_MESSAGE_LENGTH, MAX_FILE_SIZE_BYTES } from '../config';

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  disabled: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onSendFile,
  disabled,
}) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || sending || disabled) return;

    setSending(true);
    setInputError(null);
    try {
      await onSendMessage(text);
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
      await onSendFile(file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al subir archivo';
      setInputError(msg);
    } finally {
      setFileUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <footer className="p-4 bg-neutral-900/80 border-t border-neutral-800 backdrop-blur-md">
      {inputError && (
        <div
          role="alert"
          className="mb-2 p-2 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
          <span>{inputError}</span>
        </div>
      )}

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
          title="Adjuntar archivo cifrado (máx. 15MB)"
          aria-label="Adjuntar archivo cifrado (máx. 15MB)"
        >
          {fileUploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </label>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? 'Conectando a la sala...'
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
    </footer>
  );
};
