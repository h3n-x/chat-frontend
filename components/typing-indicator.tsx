"use client"

/**
 * Props for the TypingIndicator component
 */
interface TypingIndicatorProps {
  /** Array of usernames who are currently typing */
  typingUsers: string[]
}

/**
 * Typing indicator component with animated dots
 *
 * Features:
 * - Shows when users are typing
 * - Animated bouncing dots
 * - Smart text formatting for multiple users
 * - Smooth fade-in animation
 * - Automatically hides when no one is typing
 *
 * @param {TypingIndicatorProps} props - Component props
 * @returns {JSX.Element | null} Typing indicator or null if no one is typing
 */
export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null

  /**
   * Generates appropriate typing text based on number of users
   * @returns {string} Formatted typing message
   */
  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} está escribiendo...`
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} y ${typingUsers[1]} están escribiendo...`
    } else {
      return `${typingUsers.length} usuarios están escribiendo...`
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground animate-fade-in">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span>{getTypingText()}</span>
    </div>
  )
}
