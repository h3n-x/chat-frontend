<div align="center">

# 🔒 Chat Anónimo — Frontend (Client-Side E2EE v2.0)

![React](https://img.shields.io/badge/React-19.0+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict_5.7+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![WebCrypto](https://img.shields.io/badge/WebCrypto-Native_AES--256--GCM-10B981?style=for-the-badge&logo=shield&logoColor=white)

**Aplicación web cliente (SPA) con cifrado de extremo a extremo real ejecutado en el navegador, cero persistencia y diseño accesible WCAG 2.2 AA.**

[🏠 Repositorio Umbrella](https://github.com/h3n-x/chat-anonimo) • [🚀 Backend Blind Relay](https://github.com/h3n-x/chat-backend) • [🌐 Demo en Vivo](https://chat-zk.netlify.app)

</div>

---

## 🛡️ Arquitectura Criptográfica del Cliente (v2.0)

El cliente de Chat Anónimo v2.0 fue reescrito desde cero para erradicar las vulnerabilidades del diseño anterior (fallbacks débiles a XOR, generación de claves en el servidor y scripts rotos). Todas las operaciones criptográficas se ejecutan de manera aislada en la memoria RAM del navegador mediante la API nativa **`window.crypto.subtle`**.

### 1. Primitivas Criptográficas Estándar
- **Cifrado Simétrico Principal:** `AES-256-GCM` (NIST SP 800-38D).
  - Claves de 256 bits generadas con CSPRNG del navegador (`crypto.getRandomValues`).
  - Vector de Inicialización (IV): 12 bytes aleatorios únicos por cada mensaje o archivo.
  - Tag de Autenticación: 128 bits para garantizar integridad e impedir modificaciones.
- **Autenticación de Datos Asociados (AAD):** Cada operación AES-GCM vincula criptográficamente el identificador de la sala:
  $$\text{AAD} = \text{UTF-8}(\text{"room:"} + room\_id)$$
  *Cualquier intento de retransmitir o inyectar un mensaje capturado en otra sala provocará un fallo inmediato en la verificación del tag.*
- **Acuerdo de Claves Asimétrico:** `ECDH (P-256)` efímero para el intercambio de claves entre clientes cuando se unen mediante código de sala.
- **Verificación Anti-MITM Manual (Fingerprint SAS):** Código de autenticación corto de 4 palabras (*Short Authentication String*) derivado de $\text{SHA-256}(\text{RoomKey})$.
  > [!IMPORTANT]
  > **La verificación SAS NO es automática:** Ningún navegador ni protocolo criptográfico puede determinar por sí mismo si la clave proviene del interlocutor legítimo o de un atacante activo en el medio (MITM). La seguridad contra MITM depende **estrictamente de que los usuarios comparen estas 4 palabras por un canal fuera de banda** (llamada de voz o en persona).
  > 
  > En la interfaz v2.0, la sala presenta un modal interactivo bloqueante (`SasVerificationModal`):
  > 1. **Coinciden — Activar Chat:** Desbloquea el canal de texto y archivos solo tras la validación humana explícita.
  > 2. **No Coinciden — Abortar:** Purga de inmediato la clave simétrica de la memoria RAM, cierra la conexión WebSocket y expulsa al usuario de la sala de forma preventiva.

---

## 🔑 Métodos de Conexión a Salas

### Método A: Enlace Directo Zero-Knowledge (Recomendado)
- El anfitrión crea la sala y genera la `RoomKey` localmente.
- Se genera un enlace que incluye la clave simétrica en el **Hash Fragment** de la URL:
  ```text
  https://chat-zk.netlify.app/#room=K7M9P2&key=base64_256bit_key
  ```
- **Privacidad RFC 3986:** Por especificación del protocolo HTTP, los fragmentos después de `#` **jamás se envían al servidor** en las peticiones HTTP ni en cabeceras `Referer`. El servidor nunca tiene visibilidad de la clave.

### Método B: Unión por Código + Handshake ECDH
- El participante ingresa el código `K7M9P2`.
- Genera un par de claves efímero ECDH (`sk_Bob`, `pk_Bob`) y solicita la clave de la sala vía WebSocket.
- Un participante existente en la sala recibe la petición, deriva una clave de envoltura (`K_wrap`), cifra la `RoomKey` con AES-GCM y la envía de vuelta.
- El servidor solo actúa como enrutador ciego (*Blind Relay*) del handshake.

---

## 🚨 Política de No-Degradación ("Fail-Closed")

- Si la aplicación se ejecuta en un contexto no seguro (HTTP sin SSL) o en un navegador que no soporte `window.crypto.subtle`:
  - Se bloquea la interfaz de forma no descartable mediante el componente **`FailClosedBanner`**.
  - **No existe modo de degradación ni algoritmos alternativos:** Se eliminó todo código de fallback a XOR o generadores pseudoaleatorios débiles (`Math.random`).

---

## ⚠️ Límites del Modelo de Amenazas en el Cliente

> [!CAUTION]
> El cifrado de extremo a extremo en el navegador protege contra intermediarios de red y servidores curiosos, pero **no puede proteger contra las siguientes condiciones**:
> 1. **Malware o extensiones maliciosas:** Cualquier extensión instalada en el navegador con acceso a la pestaña o software espía a nivel del sistema operativo puede leer las variables de estado en memoria o el DOM renderizado.
> 2. **Omisión de la verificación SAS:** Si los usuarios no comparan de viva voz o presencialmente el código de 4 palabras del modal bloqueante, no existe garantía contra un intermediario activo en la red (MITM) que suplante las claves públicas ECDH.
> 3. **Compartición insegura de enlaces:** Transmitir el enlace directo `#room=...&key=...` por canales inseguros (SMS, correo sin cifrar) expone la clave de la sala.
> 4. **Fuga por memoria local prolongada:** Las claves viven en la memoria RAM del navegador mientras la pestaña permanezca abierta; cerrar o salir de la sala purga el estado.

---

## 📁 Transferencia Segura de Archivos

1. **Cifrado en Memoria:** El archivo se lee como `ArrayBuffer`, se empaqueta con su nombre original y tipo MIME, y se cifra con `AES-256-GCM` antes de enviarse.
2. **Subida en Streaming:** El archivo cifrado se transmite mediante HTTP POST en bloques de 64 KB hacia el relay con un tope estricto de **15 MB**.
3. **Descarga y Descifrado Local:** El receptor descarga el blob cifrado `.enc` opaco y lo descifra en memoria local, creando un Object URL temporal sin tocar el disco del servidor.

---

## 🧪 Pruebas Unitarias del Módulo Criptográfico

La suite de pruebas con **Vitest** valida todas las primitivas criptográficas directamente contra la implementación de WebCrypto:

```bash
# Ejecutar pruebas unitarias de criptografía
npm run test
```

### Pruebas Validadas:
- Generación, exportación e importación de claves `AES-256-GCM`.
- Cifrado y descifrado de mensajes con validación estricta de AAD (detección de salas falsas o manipulación).
- Acuerdo de claves Diffie-Hellman en curva elíptica (ECDH P-256) y key wrapping/unwrapping.
- Generación consistente del fingerprint Short Authentication String (SAS).

---

## 🛠️ Instalación y Desarrollo Local

### Requisitos
- Node.js 18+ o 20+
- npm

```bash
# 1. Clonar el repositorio
git clone https://github.com/h3n-x/chat-frontend.git
cd chat-frontend

# 2. Instalar dependencias limpias
npm install

# 3. Iniciar servidor de desarrollo con Vite
npm run dev

# 4. Compilar para producción (typecheck estricto + build)
npm run build

# 5. Vista previa del build de producción
npm run preview
```

### Variables de Entorno (Opcional)
Crea un archivo `.env` o `.env.local` si deseas apuntar a un backend personalizado:
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## ♿ Accesibilidad (WCAG 2.2 AA)
- Roles ARIA semánticos (`role="log"`, `role="alert"`, `aria-live`).
- Ratios de contraste de color superiores a 4.5:1 en modo oscuro.
- Foco visible navegable por teclado en todos los controles interactivos.

---

## 📜 Licencia
Distribuido bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
