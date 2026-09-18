import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';

interface BurnCountdownProps {
  expiresAt: number;
  onExpire: () => void;
}

export const BurnCountdown: React.FC<BurnCountdownProps> = ({ expiresAt, onExpire }) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (secondsLeft <= 0) return null;

  const isUrgent = secondsLeft <= 5;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md border transition-colors ${
        isUrgent
          ? 'bg-red-950/80 text-red-400 border-red-800 animate-pulse'
          : 'bg-amber-950/60 text-amber-400 border-amber-800/80'
      }`}
      title={`Este mensaje se autodestruirá en ${secondsLeft}s`}
    >
      <Flame className="w-3 h-3 text-amber-400 shrink-0" />
      <span>{secondsLeft}s</span>
    </span>
  );
};
