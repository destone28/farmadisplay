import React, { useEffect, useState } from 'react';
import { DisplayConfig } from '../../types/display';

interface Props {
  config: DisplayConfig | null;
  refreshInterval?: number;
}

export const DisplayPreview: React.FC<Props> = ({ config }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!config) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg p-8">
        <p className="text-gray-500 text-center">Crea una configurazione per vedere l'anteprima</p>
      </div>
    );
  }

  // Theme-based colors
  const getThemeColors = () => {
    if (config.theme === 'dark') {
      return {
        bg: '#1a1a1a',
        text: '#ffffff',
        primary: config.primary_color,
        secondary: config.secondary_color,
        border: '#333333'
      };
    }
    return {
      bg: '#ffffff',
      text: '#000000',
      primary: config.primary_color,
      secondary: config.secondary_color,
      border: '#e5e5e5'
    };
  };

  const colors = getThemeColors();

  // Format date and time (Italian format)
  const formatDate = () => {
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    return `${days[currentTime.getDay()]}, ${currentTime.getDate()} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()}`;
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  // Parse hours if JSON
  const getHoursDisplay = () => {
    if (!config.pharmacy_hours) return null;
    try {
      const hours = JSON.parse(config.pharmacy_hours);
      const today = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentTime.getDay()];
      const todayHours = hours[today];
      if (todayHours) {
        return `Oggi: ${todayHours.open} - ${todayHours.close}`;
      }
    } catch {
      // Fallback to plain text
      return config.pharmacy_hours;
    }
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow h-full flex flex-col">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-gray-900">Anteprima Bacheca Farmacia</h2>
        <p className="text-xs text-gray-500 mt-1">
          Questa è l'anteprima di come apparirà la bacheca della farmacia una volta premuto il pulsante "Salva Configurazione"
        </p>
      </div>

      {/* Preview Box - 4:3 ratio vertical (768px width x 1024px height scaled down) */}
      <div
        className="border-4 border-gray-800 rounded-lg overflow-hidden mx-auto"
        style={{
          width: '384px', // Half of 768 for better fit
          height: '512px', // Half of 1024
          backgroundColor: colors.bg,
          color: colors.text
        }}
      >
        <div className="flex flex-col h-full text-xs"> {/* Reduced text size */}
          {/* Header with Logo, Name and DateTime */}
          <div className="px-3 py-2 border-b-2" style={{ borderColor: colors.border }}>
            <div className="flex items-start justify-between mb-2">
              {/* Logo and Pharmacy Name */}
              <div className="flex items-center flex-1">
                {config.logo_path && (
                  <div className="w-12 h-12 flex-shrink-0 mr-2">
                    <img
                      src={`${import.meta.env.VITE_API_URL}${config.logo_path}`}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-sm font-bold leading-tight">{config.pharmacy_name}</h1>
                  {getHoursDisplay() && (
                    <p className="text-xs opacity-70 mt-0.5">{getHoursDisplay()}</p>
                  )}
                </div>
              </div>

              {/* Date and Time */}
              <div className="text-right ml-2 flex-shrink-0">
                <div className="text-xs font-semibold">{formatTime()}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{formatDate()}</div>
              </div>
            </div>
          </div>

          {/* Subtitle */}
          <div
            className="px-3 py-2 text-center font-semibold text-sm"
            style={{ backgroundColor: colors.primary, color: '#ffffff' }}
          >
            {config.subtitle_text || 'Farmacie di turno'}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex items-center justify-center p-3 overflow-hidden">
            {config.display_mode === 'image' && config.image_path ? (
              <div className="w-full h-full flex items-center justify-center">
                {config.image_path.endsWith('.pdf') ? (
                  <iframe
                    src={`${import.meta.env.VITE_API_URL}${config.image_path}#page=1`}
                    className="w-full h-full border-0"
                    title="PDF Preview"
                  />
                ) : (
                  <img
                    src={`${import.meta.env.VITE_API_URL}${config.image_path}`}
                    alt="Display"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
            ) : (
              <div className="text-center opacity-50">
                <p className="text-xs">Nessuna immagine configurata</p>
                <p className="text-[10px] mt-1">Carica un'immagine per visualizzarla</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {config.footer_text && (
            <div
              className="px-3 py-2 text-center text-[10px]"
              style={{ backgroundColor: config.secondary_color, color: '#ffffff' }}
            >
              {config.footer_text}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
