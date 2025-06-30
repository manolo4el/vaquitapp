export default function TestTailwindPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Test de Tailwind CSS
        </h1>
        <p className="text-gray-600 mb-4">
          Si ves este texto con estilos, Tailwind está funcionando.
        </p>
        <div className="space-y-2">
          <div className="bg-red-500 text-white p-2 rounded">Rojo</div>
          <div className="bg-green-500 text-white p-2 rounded">Verde</div>
          <div className="bg-blue-500 text-white p-2 rounded">Azul</div>
        </div>
      </div>
    </div>
  )
} 