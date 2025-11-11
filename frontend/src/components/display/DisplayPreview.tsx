import React, { useEffect, useState } from 'react';
import { DisplayConfig } from '../../types/display';

interface Props {
  config: DisplayConfig | null;
  refreshInterval?: number;
  isLivePreview?: boolean;
}

export const DisplayPreview: React.FC<Props> = ({ config, isLivePreview = false }) => {
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
    <div className="bg-white p-2 rounded-lg shadow h-full flex flex-col">
      <div className="mb-2">
        <h2 className="text-sm font-bold text-gray-900">Anteprima</h2>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {isLivePreview ? 'Anteprima in tempo reale' : 'Premi "Pubblica" per applicare'}
        </p>
      </div>

      {/* Preview Box - 3:4 ratio vertical - optimized for 1/4 width */}
      <div
        className="border-2 border-gray-800 rounded overflow-hidden"
        style={{
          width: '100%',
          aspectRatio: '3/4',
          backgroundColor: colors.bg,
          color: colors.text
        }}
      >
        <div className="flex flex-col h-full text-[10px]"> {/* Extra small text for compact preview */}
          {/* Header with Logo, Name and DateTime */}
          <div className="px-2 py-1.5 border-b" style={{ borderColor: colors.border }}>
            <div className="flex items-start justify-between mb-1">
              {/* Logo and Pharmacy Name */}
              <div className="flex items-center flex-1 min-w-0">
                {config.logo_path && (
                  <div className="w-8 h-8 flex-shrink-0 mr-1.5">
                    <img
                      src={`${import.meta.env.VITE_API_URL}${config.logo_path}`}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-[11px] font-bold leading-tight truncate">{config.pharmacy_name}</h1>
                  {getHoursDisplay() && (
                    <p className="text-[9px] opacity-70 mt-0.5 truncate">{getHoursDisplay()}</p>
                  )}
                </div>
              </div>

              {/* Date and Time */}
              <div className="text-right ml-1.5 flex-shrink-0">
                <div className="text-[10px] font-semibold">{formatTime()}</div>
                <div className="text-[8px] opacity-70 mt-0.5">{formatDate()}</div>
              </div>
            </div>
          </div>

          {/* Subtitle */}
          <div
            className="px-2 py-1.5 text-center font-semibold text-[10px]"
            style={{ backgroundColor: colors.primary, color: '#ffffff' }}
          >
            {config.subtitle_text || 'Farmacie di turno'}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
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
                <p className="text-[9px]">Nessuna immagine configurata</p>
                <p className="text-[8px] mt-1">Carica un'immagine per visualizzarla</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {config.footer_text && (
            <div
              className="px-2 py-1.5 text-center text-[9px]"
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
