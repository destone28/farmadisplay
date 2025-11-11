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

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Anteprima Configurazione</h2>
        <button
          onClick={() => setKey(prev => prev + 1)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          🔄 Aggiorna
        </button>
      </div>

      {/* Preview Box - Reduced height to fit screen */}
      <div
        className="border-4 border-gray-800 rounded-lg overflow-hidden"
        style={{
          backgroundColor: config.background_color,
          color: config.text_color,
          maxHeight: '600px',
          height: '600px'
        }}
      >
        <div className="flex flex-col h-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2" style={{ borderColor: config.text_color + '40' }}>
            {config.logo_path && (
              <div className="w-20 h-20 flex items-center justify-center">
                <img
                  src={`${import.meta.env.VITE_API_URL}${config.logo_path}`}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            <div className="flex-1 ml-4">
              <h1 className="text-2xl font-bold">{config.pharmacy_name}</h1>
              {config.pharmacy_hours && (
                <p className="text-sm opacity-80 mt-1">{config.pharmacy_hours}</p>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex items-center justify-center">
            {config.display_mode === 'image' && config.image_path ? (
              <div className="w-full h-full flex items-center justify-center">
                {config.image_path.endsWith('.pdf') ? (
                  <div className="text-center">
                    <p className="text-lg mb-2">📄 PDF Display</p>
                    <p className="text-sm opacity-70">{config.image_path.split('/').pop()}</p>
                  </div>
                ) : (
                  <img
                    src={`${import.meta.env.VITE_API_URL}${config.image_path}`}
                    alt="Display"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
            ) : (
              <div className="text-center opacity-60">
                <p className="text-lg">Nessuna immagine configurata</p>
                <p className="text-sm mt-2">Carica un'immagine nella sezione "Immagine/PDF Display"</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {config.footer_text && (
            <div className="mt-6 pt-4 border-t-2 text-center" style={{ borderColor: config.text_color + '40' }}>
              <p className="text-sm">{config.footer_text}</p>
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500 text-center">
        Anteprima simulata della configurazione • Aggiornamento ogni {refreshInterval / 1000}s
      </p>
    </div>
  );
};
