"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

/**
 * User interface defining the structure of connected users
 */
interface User {
  /** Unique identifier for the user */
  id: string
  /** Display name of the user */
  username: string
  /** Hex color code associated with the user */
  color: string
  /** ISO timestamp when the user connected */
  connected_at: string
  /** Optional count of messages sent by the user */
  message_count?: number
}

/**
 * Props for the UserList component
 */
interface UserListProps {
  /** Array of connected users to display */
  users: User[]
}

/**
 * User list component displaying connected users
 *
 * Features:
 * - List of all connected users with avatars
 * - Color-coded user identification
 * - Connection time and message count display
 * - Glassmorphism card styling
 * - Smooth animations and hover effects
 * - Online status indicators
 * - Empty state handling
 *
 * @param {UserListProps} props - Component props
 * @returns {JSX.Element} User list interface
 */
export default function UserList({ users }: UserListProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sidebar-foreground">Usuarios Activos</h3>
        <Badge variant="secondary" className="glass">
          {users.length}
        </Badge>
      </div>

      <div className="space-y-3">
        {users.map((user) => {
          // Validar fecha antes de formatear
          let connectedTime = "hace un momento"
          try {
            const date = new Date(user.connected_at)
            if (!isNaN(date.getTime())) {
              connectedTime = formatDistanceToNow(date, {
                addSuffix: true,
                locale: es,
              })
            }
          } catch (error) {
            console.warn("Error formatting date:", user.connected_at, error)
          }

          return (
            <Card
              key={user.id}
              className="glass bg-sidebar-accent/30 border-sidebar-border/50 p-3 hover:bg-sidebar-accent/50 transition-all duration-300 animate-fade-in"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md animate-pulse-slow"
                  style={{ backgroundColor: user.color }}
                >
                  {user.username.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sidebar-foreground truncate">{user.username}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Conectado {connectedTime}</span>
                    {user.message_count !== undefined && (
                      <>
                        <span>•</span>
                        <span>{user.message_count} mensajes</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              </div>
            </Card>
          )
        })}
      </div>

      {users.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">No hay usuarios conectados</p>
        </div>
      )}
    </div>
  )
}
