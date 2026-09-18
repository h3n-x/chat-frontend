import React, { useState } from 'react';
import { BookOpen, Users, LogOut, Send, CheckCheck } from 'lucide-react';

interface DecoyRoomProps {
  onExitDecoy: () => void;
}

interface DecoyMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isSelf?: boolean;
}

const INITIAL_DECOY_MESSAGES: DecoyMessage[] = [
  {
    id: 'm1',
    sender: 'Valeria M.',
    text: 'Hola grupo, ¿alguien tiene los apuntes del capítulo 4 sobre algoritmos de enrutamiento?',
    time: '10:14 AM',
  },
  {
    id: 'm2',
    sender: 'Carlos Ruiz',
    text: 'Sí, los subí a la carpeta compartida de Google Drive en la mañana.',
    time: '10:16 AM',
  },
  {
    id: 'm3',
    sender: 'Prof. Mendoza',
    text: 'Recuerden que la entrega del ensayo final es este viernes a las 23:59 hrs.',
    time: '10:20 AM',
  },
  {
    id: 'm4',
    sender: 'Valeria M.',
    text: 'Perfecto, gracias. ¿Nos vemos en la biblioteca a las 3pm para terminar las diapositivas?',
    time: '10:22 AM',
  },
];

export const DecoyRoom: React.FC<DecoyRoomProps> = ({ onExitDecoy }) => {
  const [messages, setMessages] = useState<DecoyMessage[]>(INITIAL_DECOY_MESSAGES);
  const [inputVal, setInputVal] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `d-${Date.now()}`,
        sender: 'Tú',
        text: inputVal.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf: true,
      },
    ]);
    setInputVal('');
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto w-full bg-neutral-900 border-x border-neutral-800 text-neutral-200">
      {/* Decoy Header */}
      <header className="px-4 py-3 bg-neutral-850 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-900/40 border border-blue-600/30 flex items-center justify-center text-blue-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              Grupo de Estudio: Redes & Sistemas
            </h1>
            <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
              <Users className="w-3 h-3 text-neutral-500" /> 4 integrantes · Proyecto Semestral
            </p>
          </div>
        </div>

        <button
          onClick={onExitDecoy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-xs font-semibold transition-colors"
          title="Salir del modo señuelo"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar</span>
        </button>
      </header>

      {/* Decoy Notice (discreet) */}
      <div className="px-4 py-1.5 bg-neutral-950/60 border-b border-neutral-800/60 text-[11px] text-neutral-500 flex items-center justify-between">
        <span>Canal de estudio académico · Modo Señuelo Activo</span>
        <span className="text-[10px] text-neutral-600">Sesión limpia en RAM</span>
      </div>

      {/* Decoy Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col max-w-[80%] ${
              m.isSelf ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            {!m.isSelf && (
              <span className="text-[11px] font-semibold text-neutral-400 mb-1 px-1">
                {m.sender}
              </span>
            )}
            <div
              className={`p-3 rounded-2xl text-xs leading-relaxed ${
                m.isSelf
                  ? 'bg-blue-600 text-white rounded-tr-xs'
                  : 'bg-neutral-800 text-neutral-200 rounded-tl-xs border border-neutral-750'
              }`}
            >
              {m.text}
              <div
                className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                  m.isSelf ? 'text-blue-200' : 'text-neutral-500'
                }`}
              >
                <span>{m.time}</span>
                {m.isSelf && <CheckCheck className="w-3 h-3" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Decoy Input */}
      <form onSubmit={handleSend} className="p-3 bg-neutral-850 border-t border-neutral-800 flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Escribe una nota para el grupo..."
          className="flex-1 bg-neutral-900 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
