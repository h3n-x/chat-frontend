"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Smile } from "lucide-react"

/**
 * Props for the MessageReactions component
 */
interface MessageReactionsProps {
  /** ID of the message these reactions belong to */
  messageId: string
  /** Object mapping emoji strings to reaction counts */
  reactions?: Record<string, number>
  /** Callback function when user adds a reaction */
  onReact: (messageId: string, emoji: string) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Available emoji options for reactions
 */
const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥"]

/**
 * Message reactions component with emoji picker
 *
 * Features:
 * - Display existing reactions with counts
 * - Interactive emoji picker with common reactions
 * - Hover-triggered reaction button
 * - Glassmorphism styling with smooth animations
 * - Click-to-react functionality
 * - Responsive design
 *
 * @param {MessageReactionsProps} props - Component props
 * @returns {JSX.Element} Message reactions interface
 */
export function MessageReactions({ messageId, reactions = {}, onReact, className = "" }: MessageReactionsProps) {
  /** Controls visibility of the emoji picker */
  const [showPicker, setShowPicker] = useState(false)

  /**
   * Handles emoji selection and closes picker
   * @param {string} emoji - Selected emoji
   */
  const handleEmojiClick = (emoji: string) => {
    onReact(messageId, emoji)
    setShowPicker(false)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Existing reactions */}
      {Object.keys(reactions).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {Object.entries(reactions).map(([emoji, count]) => (
            <Button
              key={emoji}
              size="sm"
              variant="ghost"
              onClick={() => handleEmojiClick(emoji)}
              className="h-6 px-2 text-xs glass hover:glass-strong transition-all duration-200 hover:scale-105"
            >
              <span className="mr-1">{emoji}</span>
              <span className="text-muted-foreground">{count}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Reaction picker */}
      <div className="relative">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowPicker(!showPicker)}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
        >
          <Smile className="h-3 w-3" />
        </Button>

        {showPicker && (
          <div className="absolute bottom-full left-0 mb-2 p-2 glass-strong rounded-lg shadow-lg animate-fade-in z-10">
            <div className="flex gap-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <Button
                  key={emoji}
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEmojiClick(emoji)}
                  className="h-8 w-8 p-0 hover:scale-125 transition-transform duration-200"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
