"use client"

import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"

/**
 * Props for the ConnectionStatus component
 */
interface ConnectionStatusProps {
  /** Whether the user is currently connected to the server */
  isConnected: boolean
}

/**
 * Connection status indicator component
 *
 * Features:
 * - Visual indicator of connection state
 * - Different colors for connected/disconnected states
 * - Appropriate icons (Wifi/WifiOff)
 * - Glassmorphism badge styling
 * - Accessible status information
 *
 * @param {ConnectionStatusProps} props - Component props
 * @returns {JSX.Element} Connection status badge
 */
export default function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <Badge
      variant={isConnected ? "default" : "destructive"}
      className={`glass ${isConnected ? "bg-accent/80" : "bg-destructive/80"} text-white`}
    >
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3 mr-1" />
          Conectado
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 mr-1" />
          Desconectado
        </>
      )}
    </Badge>
  )
}
