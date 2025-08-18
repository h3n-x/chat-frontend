"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { MessageReactions } from "./message-reactions"

/**
 * Message interface defining the structure of chat messages
 */
interface Message {
  /** Unique identifier for the message */
  id: string
  /** Type of message: system notifications, regular chat, or private room messages */
  type: "chat_message" | "system_message" | "room_message"
  /** The actual message content */
  message: string
  /** Username of the sender (optional for system messages) */
  username?: string
  /** ISO timestamp when the message was sent */
  timestamp: string
  /** Hex color code associated with the user */
  color?: string
  /** Unique identifier of the user who sent the message */
  user_id?: string
  /** Room ID for private room messages */
  room_id?: string
  /** Object containing emoji reactions and their counts */
  reactions?: Record<string, number>
  /** Encrypted message data for E2EE messages */
  encrypted?: any
}

/**
 * Props for the ChatMessage component
 */
interface ChatMessageProps {
  /** The message object to display */
  message: Message
  /** Callback function when user reacts to the message */
  onReact: (messageId: string, emoji: string) => void
  /** Whether this message was sent by the current user */
  isOwnMessage?: boolean
}

/**
 * Individual chat message component with glassmorphism styling
 *
 * Features:
 * - Different layouts for own vs other messages
 * - System message styling
 * - Encrypted message indicators
 * - User avatars with color coding
 * - Timestamp formatting in Spanish
 * - Message reactions display
 * - Smooth animations and hover effects
 *
 * @param {ChatMessageProps} props - Component props
 * @returns {JSX.Element} Rendered message component
 */
export default function ChatMessage({ message, onReact, isOwnMessage = false }: ChatMessageProps) {
  /** Format timestamp to relative time in Spanish */
  const timeAgo = formatDistanceToNow(new Date(message.timestamp), {
    addSuffix: true,
    locale: es,
  })

  // Handle system messages with special styling
  if (message.type === "system_message") {
    return (
      <div className="flex justify-center animate-slide-up">
        <Badge variant="secondary" className="glass bg-muted/60 text-muted-foreground px-4 py-2 rounded-full">
          {message.message}
        </Badge>
      </div>
    )
  }

  // Determine message display based on encryption
  const displayMessage = message.encrypted ? "[Mensaje cifrado E2EE]" : message.message
  const isEncrypted = !!message.encrypted

  return (
    <div className={`animate-slide-up group ${isOwnMessage ? "ml-auto max-w-[80%]" : "mr-auto max-w-[80%]"}`}>
      <Card
        className={`glass bg-card/60 border-border/30 p-4 hover:bg-card/80 transition-all duration-300 hover:shadow-lg ${
          isOwnMessage ? "bg-primary/10 border-primary/20" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          {!isOwnMessage && (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg animate-float"
              style={{ backgroundColor: message.color }}
            >
              {message.username?.charAt(0) || "?"}
            </div>
          )}

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold font-sans" style={{ color: message.color }}>
                {message.username}
              </span>
              {message.room_id && (
                <Badge variant="outline" className="text-xs glass">
                  {message.room_id}
                </Badge>
              )}
              {isEncrypted && (
                <Badge variant="secondary" className="text-xs glass bg-primary/20 text-primary">
                  🔒 E2EE
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
            <p
              className={`text-card-foreground leading-relaxed font-serif break-words ${
                isEncrypted ? "italic text-muted-foreground" : ""
              }`}
            >
              {displayMessage}
            </p>

            {/* Reactions */}
            <MessageReactions messageId={message.id} reactions={message.reactions} onReact={onReact} className="mt-2" />
          </div>

          {/* Own message avatar */}
          {isOwnMessage && (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg animate-float"
              style={{ backgroundColor: message.color }}
            >
              {message.username?.charAt(0) || "?"}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
