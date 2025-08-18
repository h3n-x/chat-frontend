"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { MessageReactions } from "./message-reactions"
import { FileMessage } from "./file-message"
import { ChatMessage as ChatMessageType } from "@/lib/chat-api"

/**
 * Props for the ChatMessage component
 */
interface ChatMessageProps {
  /** The message object to display */
  message: ChatMessageType
  /** Callback function when user reacts to the message */
  onReact: (messageId: string, emoji: string) => void
  /** Whether this message was sent by the current user */
  isOwnMessage?: boolean
  /** Function to get file URL by ID */
  getFileUrl: (fileId: string) => string
  /** Callback for file download */
  onFileDownload?: (fileId: string, filename: string) => void
  /** Callback for file preview */
  onFilePreview?: (fileId: string, mimeType: string) => void
  /** Callback for file deletion */
  onFileDelete?: (fileId: string) => void
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
export default function ChatMessage({ 
  message, 
  onReact, 
  isOwnMessage = false,
  getFileUrl,
  onFileDownload,
  onFilePreview,
  onFileDelete
}: ChatMessageProps) {
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
            <div
              className={`text-card-foreground leading-relaxed font-serif break-words ${
                isEncrypted ? "italic text-muted-foreground" : ""
              }`}
            >
              {/* Mensaje de texto regular */}
              {message.type !== "file_message" && (
                <p>{displayMessage}</p>
              )}

              {/* Mensaje de archivo */}
              {message.type === "file_message" && (
                <div className="space-y-2">
                  {message.message && (
                    <p className="mb-3">{message.message}</p>
                  )}
                  <FileMessage
                    message={message}
                    getFileUrl={getFileUrl}
                    onDownload={onFileDownload}
                    onPreview={onFilePreview}
                    onDelete={onFileDelete}
                    canDelete={isOwnMessage}
                  />
                </div>
              )}
            </div>

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
