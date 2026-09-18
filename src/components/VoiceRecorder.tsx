import React, { useEffect, useRef, useState } from 'react';
import { Square, Trash2, Send, AlertCircle, Shield } from 'lucide-react';
import { VoiceEffect, VOICE_PROFILES, setupVoiceDsp } from '../utils/voiceScrambler';

interface VoiceRecorderProps {
  onSendAudio: (audioBlob: Blob, durationSec: number, effect: VoiceEffect) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendAudio, onCancel }) => {
  const [selectedEffect, setSelectedEffect] = useState<VoiceEffect>('deep');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const rawStreamRef = useRef<MediaStream | null>(null);
  const dspCleanupRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Function to initialize recording with selected DSP effect
  const startRecording = async (effect: VoiceEffect) => {
    try {
      if (rawStreamRef.current) {
        rawStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (dspCleanupRef.current) {
        dspCleanupRef.current();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      rawStreamRef.current = stream;

      // Route through Web Audio API DSP scrambler
      const { destinationStream, cleanup } = setupVoiceDsp(stream, effect);
      dspCleanupRef.current = cleanup;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(destinationStream, { mimeType });
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
        if (rawStreamRef.current) {
          rawStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        if (dspCleanupRef.current) {
          dspCleanupRef.current();
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone or DSP initialization failed:', err);
      setError('No se pudo acceder al micrófono. Verifica los permisos del navegador.');
    }
  };

  // Start on mount
  useEffect(() => {
    startRecording(selectedEffect);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (rawStreamRef.current) {
        rawStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (dspCleanupRef.current) {
        dspCleanupRef.current();
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
      onSendAudio(audioBlob, recordingTime, selectedEffect);
    } else if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setTimeout(() => {
        if (chunksRef.current.length > 0) {
          const mime = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mime });
          onSendAudio(blob, recordingTime, selectedEffect);
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
    <div className="flex flex-col gap-2 p-2.5 rounded-2xl bg-neutral-900 border border-neutral-700/80 shadow-lg w-full animate-fade-in">
      {/* Top row: Status, Voice Distortion Profiles, Timer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
          <span className="text-xs font-mono font-semibold text-white tracking-wider">
            {formatSeconds(recordingTime)}
          </span>
          <span className="text-[11px] text-neutral-400 font-mono hidden xs:inline">
            {isRecording ? 'Distorsión biométrica activa' : 'Grabación lista'}
          </span>
        </div>

        {/* Voice Profile Selector Pills */}
        <div className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-emerald-400 mr-0.5 shrink-0" />
          {VOICE_PROFILES.map((profile) => {
            const isActive = selectedEffect === profile.id;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => {
                  if (isRecording) {
                    // Re-start with new effect
                    setSelectedEffect(profile.id);
                    startRecording(profile.id);
                  } else {
                    setSelectedEffect(profile.id);
                  }
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
                title={profile.description}
              >
                <span>{profile.icon}</span>
                <span className="hidden sm:inline">{profile.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom row: Action Controls */}
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-[10px] text-neutral-500 truncate max-w-[200px]">
          {VOICE_PROFILES.find((p) => p.id === selectedEffect)?.description}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
            title="Cancelar nota de voz"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {isRecording && (
            <button
              type="button"
              onClick={handleStopRecording}
              className="p-1.5 rounded-xl text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-colors"
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
            <span>Enviar Cifrado</span>
          </button>
        </div>
      </div>
    </div>
  );
};
