import React, { useEffect, useState } from 'react';
import { DisplayConfig } from '../../types/display';

interface Props {
  config: DisplayConfig | null;
  refreshInterval?: number; // milliseconds
}

export const DisplayPreview: React.FC<Props> = ({ config, refreshInterval = 10000 }) => {
  const [key, setKey] = useState(0);

  // Auto-refresh preview
  useEffect(() => {
    if (!config) return;

    const interval = setInterval(() => {
      setKey(prev => prev + 1);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [config, refreshInterval]);

  if (!config) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg p-8">
        <p className="text-gray-500 text-center">Crea una configurazione per vedere l'anteprima</p>
      </div>
    );
  }

  const displayUrl = `${import.meta.env.VITE_API_URL}/display/${config.pharmacy_id}?preview=true&t=${key}`;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Anteprima Live Display</h2>
        <button
          onClick={() => setKey(prev => prev + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          🔄 Aggiorna
        </button>
      </div>

      <div className="border-4 border-gray-800 rounded-lg overflow-hidden bg-gray-900" style={{ aspectRatio: '9/16' }}>
        <iframe
          key={key}
          src={displayUrl}
          className="w-full h-full"
          title="Display Preview"
        />
      </div>

      <p className="mt-2 text-sm text-gray-500 text-center">
        Aggiornamento automatico ogni {refreshInterval / 1000} secondi
      </p>
    </div>
  );
};
