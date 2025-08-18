# Documentación Técnica - Chat Anónimo Glassmorphism

## Arquitectura del Proyecto

### Estructura de Componentes

\`\`\`
components/
├── chat-interface.tsx      # Componente principal del chat
├── chat-message.tsx        # Mensaje individual con reacciones
├── connection-status.tsx   # Indicador de estado de conexión
├── message-reactions.tsx   # Sistema de reacciones con emojis
├── room-manager.tsx        # Gestión de salas privadas
├── theme-toggle.tsx        # Toggle de tema claro/oscuro
├── typing-indicator.tsx    # Indicador de usuarios escribiendo
└── user-list.tsx          # Lista de usuarios conectados
\`\`\`

### Flujo de Datos

1. **ChatInterface** (Componente Principal)
   - Maneja el estado global de la aplicación
   - Coordina la comunicación entre componentes
   - Gestiona datos mock para demostración

2. **Componentes de UI**
   - Reciben props del componente principal
   - Manejan su propio estado local cuando es necesario
   - Comunican cambios a través de callbacks

### Patrones de Diseño Utilizados

#### 1. Composition Pattern
Los componentes se componen de otros componentes más pequeños y reutilizables.

#### 2. Props Drilling
Los datos fluyen desde el componente principal hacia los componentes hijos.

#### 3. Callback Pattern
Los eventos se comunican hacia arriba a través de funciones callback.

## Interfaces y Tipos

### Message Interface
\`\`\`typescript
interface Message {
  id: string
  type: "chat_message" | "system_message" | "room_message"
  message: string
  username?: string
  timestamp: string
  color?: string
  user_id?: string
  room_id?: string
  reactions?: Record<string, number>
  encrypted?: any
}
\`\`\`

### User Interface
\`\`\`typescript
interface User {
  id: string
  username: string
  color: string
  connected_at: string
  message_count?: number
}
\`\`\`

## Funcionalidades Implementadas

### 1. Sistema de Mensajes
- **Tipos de mensaje**: Sistema, chat regular, sala privada
- **Cifrado E2EE**: Indicadores visuales para mensajes cifrados
- **Timestamps**: Formateo relativo en español
- **Identificación por colores**: Cada usuario tiene un color único

### 2. Sistema de Reacciones
- **Emojis predefinidos**: 8 opciones comunes
- **Contadores**: Muestra cantidad de cada reacción
- **Picker interactivo**: Aparece al hacer hover
- **Animaciones**: Efectos suaves al interactuar

### 3. Gestión de Salas
- **Códigos de 6 caracteres**: Generación automática
- **Validación**: Verificación de formato de código
- **Copiar al portapapeles**: Funcionalidad nativa
- **Estados visuales**: Indicadores de sala activa

### 4. Lista de Usuarios
- **Avatares coloridos**: Iniciales con color de usuario
- **Información de conexión**: Tiempo conectado y mensajes
- **Estados en tiempo real**: Indicadores de actividad
- **Responsive**: Sidebar colapsable en móvil

### 5. Indicadores de Estado
- **Conexión**: WiFi/desconectado con iconos
- **Escritura**: Puntos animados con nombres
- **Tema**: Toggle suave entre claro/oscuro

## Estilos y Animaciones

### Glassmorphism CSS Classes
\`\`\`css
.glass {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-strong {
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
\`\`\`

### Animaciones Personalizadas
- **float**: Movimiento vertical suave (6s)
- **slideUp**: Entrada desde abajo (0.5s)
- **fadeIn**: Aparición gradual (0.3s)
- **pulse-slow**: Pulsación lenta (4s)

### Variables CSS Personalizadas
El sistema de colores utiliza variables CSS para soporte de temas:
- `--background`: Color de fondo principal
- `--card`: Color de tarjetas con transparencia
- `--primary`: Color de acento principal
- `--muted`: Colores apagados para texto secundario

## Responsive Design

### Breakpoints
- **Mobile**: < 1024px - Layout vertical, sidebar overlay
- **Desktop**: ≥ 1024px - Layout horizontal, sidebar fija

### Adaptaciones Móviles
- Header compacto con controles esenciales
- Sidebar como overlay deslizante
- Botones táctiles optimizados
- Espaciado ajustado para pantallas pequeñas

## Accesibilidad

### Características Implementadas
- **Screen reader support**: Textos alternativos y labels
- **Keyboard navigation**: Navegación completa por teclado
- **Color contrast**: Cumple estándares WCAG AA
- **Focus indicators**: Indicadores visuales claros
- **Semantic HTML**: Estructura semántica correcta

### ARIA Labels
- Botones con descripciones claras
- Estados de conexión anunciados
- Contadores de usuarios accesibles

## Optimizaciones de Rendimiento

### React Optimizations
- **Componentes funcionales**: Uso de hooks modernos
- **Memoización implícita**: Props estables para evitar re-renders
- **Lazy loading**: Componentes cargados según necesidad

### CSS Optimizations
- **Tailwind purging**: Solo CSS utilizado en producción
- **Custom properties**: Variables CSS para temas eficientes
- **Hardware acceleration**: Uso de transform para animaciones

## Testing Strategy

### Componentes Testeable
Cada componente está diseñado para ser fácilmente testeable:
- Props claramente definidas
- Funciones puras cuando es posible
- Estados aislados y predecibles

### Datos Mock
Sistema completo de datos de prueba para:
- Mensajes de diferentes tipos
- Usuarios con variedad de estados
- Reacciones y interacciones

## Próximos Pasos para Implementación Real

### 1. Backend Integration
- Reemplazar datos mock con WebSocket real
- Implementar autenticación opcional
- Agregar persistencia de mensajes

### 2. Estado Global
- Implementar Context API o Zustand
- Gestión de estado más robusta
- Sincronización en tiempo real

### 3. Optimizaciones Avanzadas
- Virtual scrolling para mensajes
- Lazy loading de componentes
- Service Worker para offline support

### 4. Funcionalidades Adicionales
- Notificaciones push
- Compartir archivos/imágenes
- Moderación de contenido
- Historial de mensajes
