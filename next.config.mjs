/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para despliegue estático en Netlify
  output: 'export',
  distDir: 'build',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  
  // Forzar que las variables de entorno se incluyan en el build estático
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            // Solo incluir características estándar y ampliamente soportadas
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ],
      },
    ]
  },
}

export default nextConfig
