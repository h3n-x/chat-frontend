<h3 align="center">
  <img src="https://raw.githubusercontent.com/catppuccin/catppuccin/main/assets/misc/transparent.png" height="30" width="0"/>
  Chat Anónimo · Frontend
  <img src="https://raw.githubusercontent.com/catppuccin/catppuccin/main/assets/misc/transparent.png" height="30" width="0"/>
  <br/>
  <a href="https://github.com/h3n-x/chat-frontend">Cliente web y Android de conocimiento cero: WebCrypto nativo en RAM, React 19 y Capacitor</a>
  <br/><br/>
  <p>
    🌐 <a href="README.md">English</a> · <strong>Español</strong>
  </p>
</h3>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-89dceb?style=for-the-badge&logo=react&logoColor=d9e0ee&labelColor=363a4f" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-6-cba6f7?style=for-the-badge&logo=vite&logoColor=d9e0ee&labelColor=363a4f" alt="Vite"/>
  <img src="https://img.shields.io/badge/TypeScript-5.7_strict-74c7ec?style=for-the-badge&logo=typescript&logoColor=d9e0ee&labelColor=363a4f" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind-v4-94e2d5?style=for-the-badge&logo=tailwindcss&logoColor=d9e0ee&labelColor=363a4f" alt="Tailwind"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/WebCrypto-AES--256--GCM-a6e3a1?style=for-the-badge&labelColor=363a4f" alt="WebCrypto"/>
  <img src="https://img.shields.io/badge/Android-FLAG__SECURE-94e2d5?style=for-the-badge&logo=android&logoColor=d9e0ee&labelColor=363a4f" alt="Android"/>
  <img src="https://img.shields.io/badge/tests-12_passed-a6e3a1?style=for-the-badge&logo=vitest&logoColor=d9e0ee&labelColor=363a4f" alt="tests"/>
  <img src="https://img.shields.io/badge/license-MIT-a6e3a1?style=for-the-badge&labelColor=363a4f" alt="license"/>
</p>

<p align="center">
  <a href="https://chat-zk.netlify.app">Demo en vivo</a>
  ·
  <a href="https://github.com/h3n-x/chat-anonimo">Repo principal</a>
  ·
  <a href="https://github.com/h3n-x/chat-backend">Backend</a>
  ·
  <a href="LICENSE">Licencia</a>
</p>

&nbsp;

<p align="center">
  <img src="public/og-image.svg" alt="Chat Anónimo" width="920"/>
</p>

&nbsp;

## 🪄 Acerca de

El cliente web y móvil de [Chat Anónimo](https://github.com/h3n-x/chat-anonimo): mensajería de ultra-privacidad con toda la
criptografía aislada en la RAM del navegador, cero almacenamiento persistente, diseño accesible WCAG 2.2 AA e interfaz 100 %
responsiva.

La mayoría de los mensajeros web "cifrados de extremo a extremo" quedan expuestos a librerías criptográficas de terceros pesadas y
sin auditar, claves o mensajes escritos en silencio en `localStorage`, IndexedDB o cachés, metadatos EXIF (GPS, modelo del
teléfono, hora) que se filtran al adjuntar fotos, y exposición total si alguien es forzado a desbloquear el dispositivo. Este
cliente ejecuta **el 100 % de la criptografía y el tratamiento de medios en RAM**:

| | |
|---|---|
| 💾 **Cero persistencia** | Sin `localStorage`, sin cookies, sin Service Workers que guarden mensajes. |
| 🚫 **Fail-closed** | Si falta `window.crypto.subtle`, la app no se ejecuta. |
| 🕵️ **Anti-forense integrado** | Modo coacción, limpieza del portapapeles, esteganografía y distorsión de voz. |

&nbsp;

## 📱 Interfaz pensada para el móvil

| | |
|---|---|
| ⌨️ **Barra de entrada en dos niveles** | Arriba, píldoras de seguridad efímera (`🔥 autodestrucción off/10s/30s/1m/5m`, `👁️ ver una vez`, `🖼️ esteganografía`); abajo, adjuntar, un área de texto a ancho completo que nunca se comprime en teléfonos chicos, grabador de notas de voz y el botón de envío. |
| 😀 **Reacciones táctiles** | Reacciones efímeras cifradas (`👍` `❤️` `🔥` `🤫` `👁️`) desde un menú flotante táctil que no depende del `:hover` del ratón, con contadores agrupados. |
| ☰ **Encabezado inteligente** | En escritorio muestra todas las herramientas en línea; por debajo de `sm` se condensa en el código de sala, `QR / clave`, el botón de pánico y una hoja `⋯` con búsqueda en RAM (`Ctrl + F`), modo espía (mensajes desenfocados), tráfico señuelo, sonidos, configuración de Tor y relay, y abandonar la sala. |
| 🛡️ **Panel de seguridad plegable** | Estado del cifrado (`E2EE: AES-256-GCM`), RTT en vivo con el relay, participantes y un aviso parpadeante de **verificación SAS** hasta validarla; una línea en el móvil, desplegable para auditar la huella de 4 palabras. |

&nbsp;

## ✨ Módulos de seguridad

| Módulo | Qué hace |
|---|---|
| 🎙️ **Distorsión de voz** (`src/utils/voiceScrambler.ts`) | `BiquadFilterNode`, `DelayNode` y `GainNode` de Web Audio cambian formantes y tono antes de codificar a WebM: grave, helio, cyborg (modulación en anillo) y susurro, contra la identificación forense por huella vocal. |
| 🧹 **Limpieza de metadatos** (`src/utils/fileSanitizer.ts`) | Redibuja las imágenes en un `<canvas>` sin metadatos, eliminando EXIF, GPS, números de serie de cámara y timestamps, y renombra los archivos a `SHA-256(timestamp + random)`. |
| 👁️ **Medios de un solo uso** (`src/components/ViewOnceModal.tsx`) | Temporizador de 7 segundos, desenfoque al perder el foco y `URL.revokeObjectURL()` al cerrar, marcando el mensaje como calcinado. |
| 🎭 **Modo coacción y sala señuelo** (`src/components/DecoyRoom.tsx`) | El PIN `9999`, `/duress` o `Ctrl + Shift + D` borran todas las claves en memoria y montan un chat funcional e inocente de grupo de estudio universitario. |
| 📋 **Portapapeles con autodestrucción** (`src/utils/secureClipboard.ts`) | Las claves de sala, enlaces y frases copiadas se sobrescriben con una cadena vacía a los 30 segundos. |
| 🖼️ **Esteganografía LSB** (`src/utils/steganography.ts`) | Escribe un marcador mágico `ZKST`, una longitud de 32 bits y una carga UTF-8 en los bits RGB menos significativos de PNGs sin pérdida, desde un modal interactivo. |
| 🔤 **Frases BIP-39** (`src/utils/bip39.ts`) | El estándar BIP-39 de Bitcoin (2048 palabras, español e inglés) codifica la clave de 256 bits en 24 palabras con checksum SHA-256 de 8 bits. |
| 📱 **Android con `FLAG_SECURE`** (`android/`) | Un proyecto Capacitor cuyo `MainActivity.java` bloquea capturas (`Encendido + Vol-`), grabaciones de pantalla de malware y vistas previas del selector de tareas, y normaliza el user agent del WebView. |

&nbsp;

## 🚀 Inicio rápido

```bash
npm install
npm run dev               # servidor de desarrollo
npm run build             # build de producción (TypeScript estricto + Vite)
npx cap sync android      # sincroniza con el proyecto Android nativo
```

> [!TIP]
> Pruébalo en vivo: [chat-zk.netlify.app](https://chat-zk.netlify.app).

&nbsp;

## 🧪 Pruebas

12 pruebas unitarias protegen los algoritmos (`npm test -- --run`):

```text
 ✓ src/utils/fileSanitizer.test.ts (3 tests)
 ✓ src/utils/bip39.test.ts (4 tests)
 ✓ src/crypto/crypto.test.ts (5 tests)

 Test Files  3 passed (3)
      Tests  12 passed (12)
```

&nbsp;

<p align="center">
  <img src="https://raw.githubusercontent.com/catppuccin/catppuccin/main/assets/footers/gray0_ctp_on_line.svg?sanitize=true" alt=""/>
</p>

<p align="center">
  Copyright © 2026 <a href="https://github.com/h3n-x">h3n-x</a>
</p>

<p align="center">
  <a href="https://github.com/h3n-x/chat-frontend/blob/main/LICENSE"><img src="https://img.shields.io/static/v1?style=for-the-badge&message=MIT&logoColor=d9e0ee&label=License&labelColor=363a4f&color=a6e3a1" alt="MIT License"/></a>
</p>
