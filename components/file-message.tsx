"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  File, 
  Image, 
  FileText, 
  Archive,
  Music,
  Video,
  Download,
  Eye,
  X
} from "lucide-react"
import { ChatMessage } from "@/lib/chat-api"

interface FileMessageProps {
  message: ChatMessage
  onDownload?: (fileId: string, filename: string) => void
  onPreview?: (fileId: string, mimeType: string) => void
  onDelete?: (fileId: string) => void
  canDelete?: boolean
  getFileUrl: (fileId: string) => string
}

const FILE_TYPE_ICONS = {
  // Imágenes
  'image/jpeg': { icon: Image, color: 'bg-green-500', canPreview: true },
  'image/png': { icon: Image, color: 'bg-green-500', canPreview: true },
  'image/gif': { icon: Image, color: 'bg-green-500', canPreview: true },
  'image/webp': { icon: Image, color: 'bg-green-500', canPreview: true },
  'image/svg+xml': { icon: Image, color: 'bg-green-500', canPreview: true },
  
  // Documentos
  'application/pdf': { icon: FileText, color: 'bg-red-500', canPreview: true },
  'text/plain': { icon: FileText, color: 'bg-gray-500', canPreview: true },
  'application/msword': { icon: FileText, color: 'bg-blue-500', canPreview: false },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, color: 'bg-blue-500', canPreview: false },
  'application/vnd.ms-excel': { icon: FileText, color: 'bg-green-600', canPreview: false },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileText, color: 'bg-green-600', canPreview: false },
  
  // Archivos comprimidos
  'application/zip': { icon: Archive, color: 'bg-yellow-500', canPreview: false },
  'application/x-rar-compressed': { icon: Archive, color: 'bg-yellow-500', canPreview: false },
  
  // Audio/Video
  'audio/mpeg': { icon: Music, color: 'bg-purple-500', canPreview: true },
  'audio/wav': { icon: Music, color: 'bg-purple-500', canPreview: true },
  'video/mp4': { icon: Video, color: 'bg-indigo-500', canPreview: true },
  'video/webm': { icon: Video, color: 'bg-indigo-500', canPreview: true },
}

export function FileMessage({ 
  message, 
  onDownload, 
  onPreview, 
  onDelete, 
  canDelete = false,
  getFileUrl 
}: FileMessageProps) {
  if (!message.file_id || !message.filename || !message.mime_type) {
    return null
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeInfo = () => {
    return FILE_TYPE_ICONS[message.mime_type as keyof typeof FILE_TYPE_ICONS] || {
      icon: File,
      color: 'bg-gray-500',
      canPreview: false
    }
  }

  const fileTypeInfo = getFileTypeInfo()
  const IconComponent = fileTypeInfo.icon
  const isImage = message.mime_type?.startsWith('image/')
  const isVideo = message.mime_type?.startsWith('video/')
  const isAudio = message.mime_type?.startsWith('audio/')

  const handleDownload = () => {
    if (onDownload && message.file_id && message.filename) {
      onDownload(message.file_id, message.filename)
    } else if (message.file_id) {
      // Fallback: abrir URL de descarga
      const url = getFileUrl(message.file_id)
      const link = document.createElement('a')
      link.href = url
      link.download = message.filename || 'archivo'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handlePreview = () => {
    if (onPreview && message.file_id && message.mime_type) {
      onPreview(message.file_id, message.mime_type)
    } else if (message.file_id) {
      // Fallback: abrir en nueva ventana
      const url = getFileUrl(message.file_id)
      window.open(url, '_blank')
    }
  }

  const handleDelete = () => {
    if (onDelete && message.file_id) {
      onDelete(message.file_id)
    }
  }

  return (
    <div className="max-w-sm">
      {/* Vista previa para imágenes */}
      {isImage && message.file_id && (
        <div className="mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={getFileUrl(message.file_id)}
            alt={message.filename}
            className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handlePreview}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Vista previa para videos */}
      {isVideo && message.file_id && (
        <div className="mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <video
            src={getFileUrl(message.file_id)}
            controls
            className="w-full h-auto max-h-64"
            preload="metadata"
          />
        </div>
      )}

      {/* Vista previa para audio */}
      {isAudio && message.file_id && (
        <div className="mb-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
          <audio
            src={getFileUrl(message.file_id)}
            controls
            className="w-full"
            preload="metadata"
          />
        </div>
      )}

      {/* Información del archivo */}
      <div className="flex items-center justify-between p-3 bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-white/20">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg ${fileTypeInfo.color} flex-shrink-0`}>
            <IconComponent className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" title={message.filename}>
              {message.filename}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              {message.file_size && (
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {formatFileSize(message.file_size)}
                </span>
              )}
              <Badge variant="secondary" className="text-xs">
                {message.mime_type?.split('/')[1]?.toUpperCase() || 'ARCHIVO'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
          {fileTypeInfo.canPreview && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePreview}
              className="h-8 w-8 p-0 hover:bg-white/20"
              title="Vista previa"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="h-8 w-8 p-0 hover:bg-white/20"
            title="Descargar"
          >
            <Download className="h-4 w-4" />
          </Button>

          {canDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-500"
              title="Eliminar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
