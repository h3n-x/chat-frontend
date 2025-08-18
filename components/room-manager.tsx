"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, Users, LogOut, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

/**
 * Props for the RoomManager component
 */
interface RoomManagerProps {
  /** Current room ID if user is in a room, null otherwise */
  currentRoom: string | null
  /** Callback function when user joins a room */
  onJoinRoom: (roomId: string) => Promise<void>
  /** Callback function when user leaves current room */
  onLeaveRoom: () => void
  /** Callback function when user creates a new room */
  onCreateRoom: () => Promise<void>
  /** Whether the user is currently connected to the server */
  isConnected: boolean
}

/**
 * Room management component for private chat rooms
 *
 * Features:
 * - Join existing rooms with 6-character codes
 * - Create new private rooms with auto-generated codes
 * - Copy room codes to clipboard
 * - Leave current room
 * - Input validation for room codes
 * - Toast notifications for user feedback
 * - Glassmorphism styling with smooth animations
 *
 * @param {RoomManagerProps} props - Component props
 * @returns {JSX.Element} Room management interface
 */
export function RoomManager({ currentRoom, onJoinRoom, onLeaveRoom, onCreateRoom, isConnected }: RoomManagerProps) {
  /** Input value for room code entry */
  const [roomInput, setRoomInput] = useState("")

  /** Loading state for room creation */
  const [isCreating, setIsCreating] = useState(false)

  /** State to show copy confirmation */
  const [copied, setCopied] = useState(false)

  const { toast } = useToast()

  /**
   * Handles joining a room with validation
   */
  const handleJoinRoom = async () => {
    if (roomInput.trim() && roomInput.length === 6) {
      try {
        setIsCreating(true)
        await onJoinRoom(roomInput.toUpperCase())
        setRoomInput("")
        toast({
          title: "¡Éxito!",
          description: `Te has unido a la sala ${roomInput.toUpperCase()}`,
        })
      } catch (error) {
        toast({
          title: "Error al unirse",
          description: error instanceof Error ? error.message : "No se pudo unir a la sala",
          variant: "destructive",
        })
      } finally {
        setIsCreating(false)
      }
    } else {
      toast({
        title: "Código inválido",
        description: "El código de sala debe tener 6 caracteres",
        variant: "destructive",
      })
    }
  }

  /**
   * Handles creating a new room with loading state
   */
  const handleCreateRoom = async () => {
    setIsCreating(true)
    try {
      await onCreateRoom()
      toast({
        title: "¡Sala creada!",
        description: "Se ha creado una nueva sala privada",
      })
    } catch (error) {
      toast({
        title: "Error al crear sala",
        description: error instanceof Error ? error.message : "No se pudo crear la sala",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  /**
   * Copies the current room code to clipboard
   */
  const copyRoomCode = async () => {
    if (currentRoom) {
      await navigator.clipboard.writeText(currentRoom)
      setCopied(true)
      toast({
        title: "Código copiado",
        description: "El código de la sala se copió al portapapeles",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="glass p-4 space-y-4 animate-slide-up">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
        <Users className="h-4 w-4" />
        Salas Privadas
      </div>

      {currentRoom ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 glass-strong rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="font-mono text-sm font-semibold">{currentRoom}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={copyRoomCode} className="h-8 w-8 p-0 hover:bg-primary/20">
                {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onLeaveRoom}
                className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Código de sala (6 chars)"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              maxLength={6}
              className="glass border-0 placeholder:text-muted-foreground/60 font-mono"
              disabled={!isConnected}
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
            />
            <Button
              onClick={handleJoinRoom}
              disabled={!isConnected || roomInput.length !== 6 || isCreating}
              className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/30"
              variant="outline"
            >
              {isCreating ? "..." : "Unirse"}
            </Button>
          </div>

          <Button
            onClick={handleCreateRoom}
            disabled={!isConnected || isCreating}
            className="w-full glass-strong hover:bg-primary/20 transition-all duration-300"
            variant="ghost"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? "Creando..." : "Crear Sala"}
          </Button>
        </div>
      )}
    </Card>
  )
}
