import React, { useState } from 'react';
import { Download, File, Loader2, CheckCircle2 } from 'lucide-react';

interface FileAttachmentProps {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  onDownload: (fileId: string, fileName: string, mimeType: string) => Promise<void>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  fileId,
  fileName,
  fileSize,
  mimeType,
  onDownload,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setError(null);
    try {
      await onDownload(fileId, fileName, mimeType);
      setCompleted(true);
      setTimeout(() => setCompleted(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al descargar archivo';
      setError(msg);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mt-2 p-3 bg-neutral-900/90 border border-neutral-800 rounded-xl max-w-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300 shrink-0">
          <File className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-200 truncate" title={fileName}>
            {fileName}
          </p>
          <p className="text-xs text-neutral-400">
            {formatFileSize(fileSize)} • Cifrado AES-GCM
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 shrink-0"
          title="Descargar y descifrar archivo en memoria"
          aria-label={`Descargar y descifrar archivo ${fileName}`}
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          ) : completed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
};
