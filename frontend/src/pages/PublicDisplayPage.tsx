import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { displayConfigService } from '../services/displayConfigService';
import { DisplayConfig } from '../types/display';

export const PublicDisplayPage: React.FC = () => {
  const { pharmacyId } = useParams<{ pharmacyId: string }>();
  const [config, setConfig] = useState<DisplayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch display config
  useEffect(() => {
    const fetchConfig = async () => {
      if (!pharmacyId) {
        setError('ID farmacia mancante');
        setLoading(false);
        return;
      }

      try {
        const data = await displayConfigService.getConfig(pharmacyId);
        setConfig(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching config:', err);
        setError(err.response?.data?.detail || 'Errore nel caricamento della configurazione');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();

    // Refresh config every 30 seconds
    const refreshInterval = setInterval(fetchConfig, 30000);

    return () => clearInterval(refreshInterval);
  }, [pharmacyId]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Theme-based colors
  const getThemeColors = () => {
    if (!config) return { bg: '#ffffff', text: '#000000', primary: '#0066CC', secondary: '#00A3E0', border: '#e5e5e5' };

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
    if (!config?.pharmacy_hours) return null;
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

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento bacheca...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Errore</h1>
          <p className="text-gray-600 mb-4">{error || 'Configurazione non trovata'}</p>
          <p className="text-sm text-gray-500">ID Farmacia: {pharmacyId}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-screen h-screen flex flex-col overflow-hidden"
      style={{
        backgroundColor: colors.bg,
        color: colors.text
      }}
    >
      {/* Header with Logo, Name and DateTime */}
      <div className="px-8 py-6 border-b-4" style={{ borderColor: colors.border }}>
        <div className="flex items-start justify-between">
          {/* Logo and Pharmacy Name */}
          <div className="flex items-center flex-1">
            {config.logo_path && (
              <div className="w-24 h-24 flex-shrink-0 mr-6">
                <img
                  src={`${import.meta.env.VITE_API_URL}${config.logo_path}`}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold leading-tight">{config.pharmacy_name}</h1>
              {getHoursDisplay() && (
                <p className="text-2xl opacity-70 mt-2">{getHoursDisplay()}</p>
              )}
            </div>
          </div>

          {/* Date and Time */}
          <div className="text-right ml-6 flex-shrink-0">
            <div className="text-5xl font-bold">{formatTime()}</div>
            <div className="text-xl opacity-70 mt-2">{formatDate()}</div>
          </div>
        </div>
      </div>

      {/* Subtitle */}
      <div
        className="px-8 py-5 text-center font-semibold text-3xl"
        style={{ backgroundColor: colors.primary, color: '#ffffff' }}
      >
        {config.subtitle_text || 'Farmacie di turno'}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {config.display_mode === 'image' && config.image_path ? (
          <div className="w-full h-full">
            {config.image_path.endsWith('.pdf') ? (
              <iframe
                src={`${import.meta.env.VITE_API_URL}${config.image_path}#page=1`}
                className="w-full h-full border-0"
                title="PDF Display"
              />
            ) : (
              <img
                src={`${import.meta.env.VITE_API_URL}${config.image_path}`}
                alt="Display"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-center opacity-50">
            <div>
              <p className="text-3xl">Nessun contenuto configurato</p>
              <p className="text-xl mt-4">Configurare il display dalla dashboard</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {config.footer_text && (
        <div
          className="px-8 py-5 text-center text-xl"
          style={{ backgroundColor: config.secondary_color, color: '#ffffff' }}
        >
          {config.footer_text}
        </div>
      )}
    </div>
  );
};
