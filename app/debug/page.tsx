"use client"

import { useEffect, useState } from "react"

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})

  const runDebug = () => {
    const info: any = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      localStorage: {},
      sessionStorage: {},
      cookies: document.cookie,
    }

    // Verificar localStorage
    try {
      const authState = localStorage.getItem("amigo-gastos-auth-state")
      const userProfile = localStorage.getItem("amigo-gastos-user-profile")
      const pendingInvite = localStorage.getItem("amigo-gastos-pending-invite")
      
      info.localStorage = {
        authState: authState ? JSON.parse(authState) : null,
        userProfile: userProfile ? JSON.parse(userProfile) : null,
        pendingInvite,
      }
    } catch (error) {
      info.localStorageError = error
    }

    // Verificar sessionStorage
    try {
      info.sessionStorage = {
        keys: Object.keys(sessionStorage),
        values: {}
      }
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key) {
          info.sessionStorage.values[key] = sessionStorage.getItem(key)
        }
      }
    } catch (error) {
      info.sessionStorageError = error
    }

    setDebugInfo(info)
    console.log("🔍 Debug Info:", info)
  }

  const clearData = () => {
    try {
      localStorage.removeItem("amigo-gastos-auth-state")
      localStorage.removeItem("amigo-gastos-user-profile")
      localStorage.removeItem("amigo-gastos-pending-invite")
      alert("Datos limpiados. Recarga la página.")
    } catch (error) {
      alert("Error al limpiar datos: " + error)
    }
  }

  useEffect(() => {
    runDebug()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🔍 Debug de Autenticación</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={runDebug}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            🔄 Actualizar Debug
          </button>
          
          <button
            onClick={clearData}
            className="bg-red-500 text-white px-4 py-2 rounded ml-2"
          >
            🗑️ Limpiar Datos
          </button>
          
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
          >
            ← Volver al Dashboard
          </button>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Información de Debug:</h2>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="mt-4 bg-yellow-100 p-4 rounded">
          <h3 className="font-semibold mb-2">📋 Instrucciones:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Abre esta página en tu celular y PC</li>
            <li>Haz login con el mismo email en ambos</li>
            <li>Compara la información de debug</li>
            <li>Busca diferencias en localStorage o userAgent</li>
            <li>Si hay problemas, usa "Limpiar Datos" y vuelve a probar</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 