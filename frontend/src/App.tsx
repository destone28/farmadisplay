import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-600 mb-4">
          FarmaDisplay Dashboard
        </h1>
        <p className="text-gray-600 mb-8">
          Sistema di gestione turni farmacie
        </p>
        <button
          onClick={() => setCount((count) => count + 1)}
          className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded"
        >
          Count is {count}
        </button>
      </div>
    </div>
  )
}

export default App
