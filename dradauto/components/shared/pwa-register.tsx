'use client'
import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registrado com sucesso:', registration.scope)
        })
        .catch((err) => {
          console.error('Falha ao registrar SW:', err)
        })
    }
  }, [])

  return null
}
