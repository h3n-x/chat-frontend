<div align="center">

# 🔒 Chat Anónimo — Frontend Client & Mobile App (v2.5)
### Cliente SPA Cero-Conocimiento en React 19 + TypeScript + WebCrypto Nativo + Capacitor Android

![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite 6](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict_5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![WebCrypto](https://img.shields.io/badge/WebCrypto-AES--256--GCM_Native-10B981?style=for-the-badge&logo=shield&logoColor=white)
![Android FLAG_SECURE](https://img.shields.io/badge/Android-FLAG__SECURE_Enforced-A4C639?style=for-the-badge&logo=android&logoColor=black)
![Tests](https://img.shields.io/badge/Vitest-12%2F12_Passing-success?style=for-the-badge&logo=vitest)

**Cliente web y móvil de ultra-privacidad con ejecución criptográfica aislada en memoria RAM, cero almacenamiento persistente, diseño accesible WCAG 2.2 AA e interfaz 100% responsiva.**

[🚀 Probar en Vivo](https://chat-zk.netlify.app) • [🏠 Repositorio Umbrella](https://github.com/h3n-x/chat-anonimo) • [⚙️ Backend Relay](https://github.com/h3n-x/chat-backend)

</div>

---

## 🎯 ¿Por qué este cliente es revolucionario?

En la mayoría de aplicaciones de mensajería web ("end-to-end encrypted"), los clientes son vulnerables a una serie de vectores críticos:
1. **Librerías criptográficas de terceros pesadas y no auditadas** que introducen fallos de canal lateral.
2. **Almacenamiento inadvertido en disco:** Las claves o mensajes se escriben silenciosamente en `localStorage`, `IndexedDB` o caches del navegador.
3. **Fuga de metadatos:** Al adjuntar una foto tomada con el móvil, se envían metadatos EXIF que contienen coordenadas GPS exactas, modelo de teléfono y fecha/hora.
4. **Vulnerabilidad a inspección física y coacción:** Si una persona es forzada a desbloquear su dispositivo, el historial queda al descubierto.

### La Solución de Chat Anónimo v2.5:
Este cliente ejecuta **100% de la criptografía y el tratamiento de medios en la memoria RAM del navegador**:
* **Cero Persistencia:** No hay `localStorage`, ni cookies, ni Service Workers que guarden mensajes.
* **Fail-Closed:** Si `window.crypto.subtle` no está presente, la aplicación se bloquea de forma preventiva.
* **Anti-Forense Integrado:** Cuenta con modo coacción, borrado de portapapeles, esteganografía y distorsión de voz.

---

## 📱 Experiencia Móvil & Interfaz Responsiva Adaptativa

La interfaz ha sido diseñada para operar fluidamente tanto en pantallas táctiles móviles de 360px como en monitores ultra-wide:

### 1. Barra de Entrada en Dos Niveles (Anti-Aplastamiento)
* **Nivel Superior (Ribbon de Seguridad Efímera):** Píldoras compactas e interactivas con estados visuales claros:
  - `[🔥 Destruir: Off / 10s / 30s / 1m / 5m]` (autodestrucción TTL).
  - `[👁️ Ver 1 vez (Activo / Inactivo)]` (medios efímeros con autodestrucción).
  - `[🖼️ Esteganografía]` (abrir modulador de imágenes portadoras).
* **Nivel Inferior (Entrada Principal):**
  - Botón de adjuntos `[📎]`.
  - Área de texto con **ancho completo expandible (`flex-1`)** que nunca se comprime en teléfonos pequeños.
  - Grabador de notas de voz `[🎤]`.
  - Botón de envío esmeralda `[➤]`.

### 2. Sistema de Reacciones Táctiles en Móvil
* **Reacciones Efímeras Cifradas:** Emojis seleccionables (`👍`, `❤️`, `🔥`, `🤫`, `👁️`).
* **Soporte Táctil Nativo:** En dispositivos móviles, pulsar sobre el mensaje o el botón de carita `Smile` despliega un menú flotante con soporte táctil optimizado (sin depender de pseudo-clases `:hover` de ratón).
* **Badges Agrupados:** Conteo de reacciones en tiempo real con botón `+` para reaccionar rápidamente.

### 3. Encabezado Inteligente con Menú de Herramientas Móvil
* En pantallas de escritorio, muestra todas las herramientas en línea.
* En pantallas móviles reducidas (`< sm`), sintetiza la barra en:
  - Código de sala `[WDQDJ7]` y botón `[QR / Clave]`.
  - Botón de pánico `[🔥 Pánico]`.
  - Menú de 3 puntos `[⋯]` que despliega una hoja flotante con:
    - 🔍 *Buscar en memoria RAM* (`Ctrl + F`).
    - 👁️ *Modo Espía* (difumina mensajes para evitar miradas indiscretas).
    - 📡 *Camuflaje de Tráfico Señuelo* (paquetes periódicos).
    - 🔊 *Silenciar / Activar Sonidos sintéticos*.
    - 🧅 *Configuración de Red Tor & Relay*.
    - 🚪 *Abandonar Sala*.

### 4. Panel de Seguridad Colapsable
* Muestra de un vistazo el estado de cifrado `E2EE: AES-256-GCM`, latencia RTT con el relay (`● 24 ms`), número de participantes y alerta parpadeante de **Verificación SAS** si no se ha validado contra ataques MITM.
* En móviles, se contrae en una sola línea y puede desplegarse con un toque para auditar el fingerprint criptográfico de 4 palabras.

---

## 🛡️ Catálogo de Módulos & Funcionalidades de Seguridad

### 🎙️ Distorsión Biométrica de Voz (`src/utils/voiceScrambler.ts`)
* Utiliza nodos `BiquadFilterNode`, `DelayNode` y `GainNode` de la Web Audio API nativa.
* Modula formantes y pitch antes de codificar el audio a WebM:
  - **Voz Grave / Deep Pitch:** Desplaza formantes hacia frecuencias bajas.
  - **Voz Aguda / Helio:** Aumenta las frecuencias superiores.
  - **Cyborg / Robótica:** Introduce modulación en anillo y cortes metálicos.
  - **Susurro:** Filtra las frecuencias vocálicas fundamentales dejando únicamente la banda aérea.
* Impide la identificación por huella vocal forense o reconocimiento acústico automático.

### 🧹 Depurador Profundo de Metadatos (`src/utils/fileSanitizer.ts`)
* Re-dibuja imágenes entrantes en un `<canvas>` sin contexto de metadatos, erradicando segmentos EXIF, coordenadas de geolocalización GPS, número de serie del sensor de cámara y timestamps.
* Reemplaza el nombre de archivo con un hash `SHA-256(timestamp + random)` para evitar fuga de información por nombres de archivo (`IMG_20260918_WA0001.jpg`).

### 👁️ Medios Efímeros "Ver Una Sola Vez" (`src/components/ViewOnceModal.tsx`)
* Temporizador visual de **7 segundos**.
* Protección anti-captura: desenfoca la pantalla si la ventana o pestaña pierde el foco.
* Al cerrar o expirar, revoca inmediatamente el blob en RAM con `URL.revokeObjectURL()` y marca el mensaje como calcinado irreversiblemente.

### 🎭 Modo Coacción y Sala Señuelo (`src/components/DecoyRoom.tsx`)
* Activación mediante PIN **`9999`**, comando **`/duress`** o hotkey **`Ctrl + Shift + D`**.
* Ejecuta un borrado destructivo de todas las claves en memoria y monta una sala falsa de estudio universitario (*"Grupo de Estudio: Redes & Sistemas"*) con chat funcional inocente para despistar a cualquier extorsionador.

### 📋 Portapapeles con Auto-Destrucción (`src/utils/secureClipboard.ts`)
* Cada vez que el usuario copia una clave de sala, enlace o frase mnemónica, se programa una tarea que sobreescribe el portapapeles del sistema operativo con una cadena vacía tras **30 segundos**.

### 🖼️ Esteganografía de Imagen LSB (`src/utils/steganography.ts`)
* Inyecta el marcador mágico `ZKST`, longitud de 32 bits y carga útil UTF-8 en los bits menos significativos de los canales RGB de imágenes PNG sin pérdidas.
* Permite ocultar textos secretos dentro de fotos digitales comunes y compartirlas o revelarlas desde el modal interactivo.

### 🔤 Frases Mnemónicas BIP-39 (`src/utils/bip39.ts`)
* Implementa el estándar Bitcoin BIP-39 con diccionario de 2048 palabras en español/inglés.
* Codifica la clave simétrica de 256 bits en **24 palabras legibles** con checksum SHA-256 de 8 bits para verificación y respaldo resistente a fallos humanos.

### 📱 Aplicación Android Nativa con `FLAG_SECURE` (`android/`)
* Proyecto Capacitor con configuración nativa en `MainActivity.java`.
* **`FLAG_SECURE` a Nivel de Sistema Operativo:** Bloquea capturas de pantalla físicas (`Power + Bajar Volumen`), bloquea grabaciones de pantalla de malware y oculta la vista previa en el selector de tareas del teléfono.
* Suplanta el User-Agent del WebView a una firma estandarizada común para anonimizar el modelo del teléfono.

---

## 🧪 Pruebas Unitarias del Cliente (Vitest)

El frontend incluye 12 pruebas unitarias automatizadas que garantizan la corrección de los algoritmos:

```bash
cd chat-frontend
npm test -- --run
```

```text
 ✓ src/utils/fileSanitizer.test.ts (3 tests)
 ✓ src/utils/bip39.test.ts (4 tests)
 ✓ src/crypto/crypto.test.ts (5 tests)

 Test Files  3 passed (3)
      Tests  12 passed (12)
```

---

## 🚀 Instalación y Ejecución

```bash
# 1. Instalar dependencias
cd chat-frontend
npm install

# 2. Servidor de desarrollo
npm run dev

# 3. Compilación de producción (TypeScript estricto + Vite)
npm run build

# 4. Sincronizar con el proyecto nativo de Android
npx cap sync android
```

---

## 📜 Licencia
Distribuido bajo la Licencia **MIT**.
