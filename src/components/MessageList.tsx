import React, { useEffect, useRef } from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { ChatMessage } from '../types';
import { FileAttachment } from './FileAttachment';

interface MessageListProps {
  messages: ChatMessage[];
  onDownloadFile: (fileId: string, fileName: string, mimeType: string) => Promise<void>;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onDownloadFile,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-400">
        <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3 text-neutral-500">
          <ShieldCheck className="w-6 h-6 text-emerald-500/80" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-neutral-300">Sala cifrada iniciada</p>
        <p className="text-xs text-neutral-400 max-w-xs mt-1">
          Ningún mensaje se almacena en el servidor ni en tu disco. Envía tu primer mensaje
          o comparte el enlace seguro.
        </p>
      </div>
    );
  }

  return (
    <div
      role="log"
      aria-label="Historial de mensajes"
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {messages.map((msg) => {
        if (msg.corrupted) {
          return (
            <div
              key={msg.id}
              className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2 max-w-md mx-auto"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
              <span>{msg.text}</span>
            </div>
          );
        }

        return (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.is_self ? 'items-end' : 'items-start'}`}
          >
            {/* Sender and Time */}
            <div className="flex items-center gap-2 mb-1 px-1">
              <span
                className="text-xs font-semibold"
                style={{ color: msg.color || '#10B981' }}
              >
                {msg.is_self ? 'Tú' : msg.sender_name}
              </span>
              <span className="text-[10px] text-neutral-400">
                {formatTime(msg.timestamp)}
              </span>
            </div>

            {/* Bubble */}
            <div
              className={`max-w-md md:max-w-lg p-3 rounded-2xl text-sm leading-relaxed ${
                msg.is_self
                  ? 'bg-emerald-600/20 text-neutral-100 border border-emerald-500/30 rounded-tr-sm'
                  : 'bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-tl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.text}</p>

              {msg.file && (
                <FileAttachment
                  fileId={msg.file.file_id}
                  fileName={msg.file.file_name}
                  fileSize={msg.file.file_size}
                  mimeType={msg.file.mime_type}
                  onDownload={onDownloadFile}
                />
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
