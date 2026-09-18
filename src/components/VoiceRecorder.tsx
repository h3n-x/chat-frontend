import React, { useEffect, useRef, useState } from 'react';
import { Square, Trash2, Send, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onSendAudio: (audioBlob: Blob, durationSec: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendAudio, onCancel }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Start recording on mount
  useEffect(() => {
    let mounted = true;

    async function initRecorder() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : 'audio/webm';

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          setAudioBlob(blob);
          stream.getTracks().forEach((track) => track.stop());
        };

        recorder.start(100);
        setIsRecording(true);

        timerRef.current = window.setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        if (!mounted) return;
        console.error('Microphone permission denied or unavailable:', err);
        setError('No se pudo acceder al micrófono. Verifica los permisos del navegador.');
      }
    }

    initRecorder();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSendAudio(audioBlob, recordingTime);
    } else if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      // Wait for onstop callback to fire
      setTimeout(() => {
        if (chunksRef.current.length > 0) {
          const mime = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mime });
          onSendAudio(blob, recordingTime);
        }
      }, 150);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-neutral-900 border border-red-500/40 text-xs text-red-400 w-full animate-fade-in">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          onClick={onCancel}
          className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-neutral-900 border border-neutral-700/80 shadow-lg w-full animate-fade-in">
      {/* Recording status & timer */}
      <div className="flex items-center gap-2.5 pl-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
        <span className="text-xs font-mono font-semibold text-white tracking-wider">
          {formatSeconds(recordingTime)}
        </span>
        <span className="text-[11px] text-neutral-400 hidden sm:inline">
          {isRecording ? 'Grabando nota de voz E2EE...' : 'Grabación finalizada'}
        </span>
      </div>

      {/* Action controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
          title="Cancelar nota de voz"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {isRecording && (
          <button
            type="button"
            onClick={handleStopRecording}
            className="p-2 rounded-xl text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-colors"
            title="Pausar grabación"
          >
            <Square className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={handleSend}
          disabled={recordingTime === 0 && !audioBlob}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Enviar</span>
        </button>
      </div>
    </div>
  );
};
