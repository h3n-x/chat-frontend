export const createNotificationSound = () => {
  // Crear un AudioContext para generar un sonido de notificación
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  
  const playNotificationSound = () => {
    try {
      // Crear osciladores para un sonido de notificación tipo "ding"
      const oscillator1 = audioContext.createOscillator()
      const oscillator2 = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      // Configurar frecuencias (do mayor)
      oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
      oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime) // E5
      
      // Configurar el tipo de onda
      oscillator1.type = 'sine'
      oscillator2.type = 'sine'
      
      // Configurar el volumen (envelope)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5)
      
      // Conectar los nodos
      oscillator1.connect(gainNode)
      oscillator2.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Reproducir el sonido
      oscillator1.start(audioContext.currentTime)
      oscillator2.start(audioContext.currentTime)
      
      // Detener después de 0.5 segundos
      oscillator1.stop(audioContext.currentTime + 0.5)
      oscillator2.stop(audioContext.currentTime + 0.5)
      
    } catch (error) {
      console.log('No se pudo reproducir el sonido de notificación:', error)
    }
  }
  
  return playNotificationSound
}
