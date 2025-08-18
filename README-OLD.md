# Chat Anónimo - Frontend

Una aplicación de chat anónimo en tiempo real con un diseño moderno inspirado en el glassmorphism de Apple. Incluye funcionalidad completa de chat con cifrado E2E y subida de archivos.

## 🚀 Configuración para Producción

### Variables de Entorno

Para producción con HTTPS, configura las siguientes variables en tu servicio de hosting:

```bash
# En Netlify, Vercel, etc:
NEXT_PUBLIC_WS_URL=wss://tu-backend.com/ws
NEXT_PUBLIC_API_URL=https://tu-backend.com
```

### Archivos de Configuración

1. **Desarrollo**: `.env.local`
```bash
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_API_URL=http://localhost:8000
```

2. **Producción**: `.env.production`
```bash
NEXT_PUBLIC_WS_URL=wss://tu-backend.com/ws
NEXT_PUBLIC_API_URL=https://tu-backend.com
```

### Deploy en Netlify

1. Configura las variables de entorno en la configuración del sitio
2. El código detecta automáticamente si usar `wss://` en HTTPS
3. Build automático: `npm run build`

## 🎨 Características de Diseño

### Glassmorphism
- **Efectos de vidrio translúcido** con `backdrop-filter: blur()`
- **Transparencias sutiles** para crear profundidad visual
- **Bordes suaves** con colores semi-transparentes
- **Sombras difusas** para elevar elementos

### Paleta de Colores
- **Colores pasteles** para una experiencia visual suave
- **Verde esmeralda** (#10b981) como color primario
- **Azul cian claro** (#ecfeff) como fondo base
- **Grises pizarra** para texto y elementos secundarios
- **Soporte completo** para modo oscuro y claro

### Tipografía
- **Geist** - Fuente principal para encabezados y elementos destacados
- **Manrope** - Fuente secundaria para texto de cuerpo
- **Jerarquía clara** con tamaños y pesos consistentes

## 🚀 Funcionalidades Visuales

### Chat Principal
- **Burbujas de mensaje** con efecto glassmorphism
- **Identificación por colores** para usuarios anónimos
- **Timestamps** con formato legible
- **Animaciones suaves** para nuevos mensajes

### Sistema de Reacciones
- **Picker de emojis** con reacciones comunes
- **Contadores de reacciones** con efectos hover
- **Indicadores visuales** para reacciones propias

### Gestión de Salas
- **Modal glassmorphism** para crear/unirse a salas
- **Códigos de sala** de 6 caracteres
- **Validación visual** de formularios

### Lista de Usuarios
- **Sidebar translúcido** con usuarios conectados
- **Avatares coloridos** con iniciales
- **Indicadores de estado** (conectado, escribiendo)
- **Contador de usuarios** en tiempo real

### Indicadores de Estado
- **Estado de conexión** con iconos animados
- **Indicador E2EE** (End-to-End Encryption)
- **Información de sala** actual
- **Indicador de escritura** con puntos animados

### Tema Dinámico
- **Toggle glassmorphism** para cambiar tema
- **Transiciones suaves** entre modos
- **Colores adaptativos** para cada tema

## 🛠️ Tecnologías Utilizadas

### Frontend Framework
- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático para mejor desarrollo
- **React 18** - Biblioteca de interfaz de usuario

### Styling
- **Tailwind CSS v4** - Framework de utilidades CSS
- **CSS Custom Properties** - Variables CSS para temas
- **Backdrop Filter** - Efectos de blur nativo del navegador

### Componentes UI
- **shadcn/ui** - Biblioteca de componentes accesibles
- **Radix UI** - Primitivos de UI sin estilos
- **Lucide React** - Iconos SVG optimizados

### Gestión de Estado
- **next-themes** - Gestión de temas claro/oscuro
- **React Hooks** - Estado local de componentes

## 📁 Estructura del Proyecto

\`\`\`
├── app/
│   ├── globals.css          # Estilos globales y variables CSS
│   ├── layout.tsx           # Layout principal con providers
│   └── page.tsx             # Página principal
├── components/
│   ├── ui/                  # Componentes base de shadcn/ui
│   ├── chat-interface.tsx   # Interfaz principal del chat
│   ├── chat-message.tsx     # Componente de mensaje individual
│   ├── connection-status.tsx # Indicador de estado de conexión
│   ├── message-reactions.tsx # Sistema de reacciones
│   ├── room-manager.tsx     # Gestión de salas privadas
│   ├── theme-toggle.tsx     # Toggle de tema claro/oscuro
│   ├── typing-indicator.tsx # Indicador de escritura
│   └── user-list.tsx        # Lista de usuarios conectados
└── lib/
    └── utils.ts             # Utilidades y helpers
\`\`\`

## 🎯 Componentes Principales

### ChatInterface
Componente principal que orquesta toda la interfaz del chat. Maneja el estado visual de mensajes, usuarios, y salas.

### ChatMessage
Renderiza mensajes individuales con efectos glassmorphism, reacciones, y identificación por colores.

### RoomManager
Modal para crear y unirse a salas privadas con validación visual y códigos de 6 caracteres.

### MessageReactions
Sistema completo de reacciones con picker de emojis y contadores animados.

### UserList
Sidebar con lista de usuarios conectados, avatares coloridos, e indicadores de estado.

### ThemeToggle
Toggle elegante para cambiar entre modo claro y oscuro con transiciones suaves.

## 🎨 Sistema de Colores

### Modo Claro
- **Fondo**: Cian claro con gradientes radiales
- **Vidrio**: Blanco semi-transparente (25-60% opacidad)
- **Texto**: Grises pizarra para legibilidad
- **Acentos**: Verde esmeralda para elementos interactivos

### Modo Oscuro
- **Fondo**: Azul pizarra oscuro
- **Vidrio**: Grises oscuros semi-transparentes
- **Texto**: Grises claros para contraste
- **Acentos**: Verde esmeralda mantenido para consistencia

## ✨ Efectos y Animaciones

### Efectos de Vidrio
- **blur(20px)** para efectos sutiles
- **blur(40px)** para elementos destacados
- **Bordes semi-transparentes** para definición

### Animaciones CSS
- **float** - Movimiento vertical suave (6s)
- **slideUp** - Entrada de elementos (0.5s)
- **fadeIn** - Aparición gradual (0.3s)
- **pulse-slow** - Pulsación lenta (4s)

### Transiciones
- **hover:scale-105** - Escalado sutil en hover
- **transition-all duration-300** - Transiciones suaves
- **animate-bounce** - Rebote para indicadores

## 🔧 Instalación y Uso

\`\`\`bash
# Clonar el repositorio
git clone [repository-url]

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
\`\`\`

## 📱 Responsive Design

- **Mobile First** - Diseño optimizado para móviles
- **Breakpoints** - sm, md, lg, xl para diferentes pantallas
- **Sidebar colapsable** - Se adapta a pantallas pequeñas
- **Touch friendly** - Botones y áreas táctiles optimizadas

## 🎭 Datos Mock

La aplicación utiliza datos simulados para demostrar todas las funcionalidades visuales:

- **Usuarios ficticios** con nombres y colores aleatorios
- **Mensajes de ejemplo** con diferentes tipos de contenido
- **Reacciones simuladas** con contadores variables
- **Estados de conexión** alternantes para demostración

## 🚀 Próximos Pasos

Para convertir esto en una aplicación funcional:

1. **Integrar WebSocket** para comunicación en tiempo real
2. **Implementar backend** con las APIs correspondientes
3. **Agregar persistencia** de mensajes y salas
4. **Implementar autenticación** opcional
5. **Añadir cifrado E2EE** real
6. **Optimizar rendimiento** para muchos usuarios

## 📄 Licencia

Este proyecto es una demostración de diseño y está disponible para uso educativo y de referencia.
