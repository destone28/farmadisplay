import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { displayConfigService } from '../services/displayConfigService';
import { DisplayConfig } from '../types/display';
import { scrapingService, PharmacyShiftInfo } from '../services/scrapingService';

export const PublicDisplayPage: React.FC = () => {
  const { pharmacyId } = useParams<{ pharmacyId: string }>();
  const [config, setConfig] = useState<DisplayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pharmacies, setPharmacies] = useState<PharmacyShiftInfo[]>([]);
  const [scrapingError, setScrapingError] = useState<string | null>(null);

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

  // Fetch scraped pharmacies if in SCRAPED mode
  useEffect(() => {
    if (!config || config.display_mode !== 'scraped') return;

    const fetchPharmacies = async () => {
      try {
        const response = await scrapingService.searchPharmacies(
          config.scraping_cap || undefined,
          config.scraping_city || undefined
        );
        setPharmacies(response.pharmacies);
        setScrapingError(null);
      } catch (err: any) {
        console.error('Error fetching pharmacies:', err);
        setScrapingError('Errore nel caricamento delle farmacie');
      }
    };

    fetchPharmacies();

    // Refresh pharmacies every 30 seconds
    const refreshInterval = setInterval(fetchPharmacies, 30000);

    return () => clearInterval(refreshInterval);
  }, [config]);

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
        // Handle both string format (e.g., "08:30-13, 16-20") and object format
        if (typeof todayHours === 'string') {
          return `Orario di oggi: ${todayHours}`;
        } else if (todayHours.open && todayHours.close) {
          return `Orario di oggi: ${todayHours.open} - ${todayHours.close}`;
        }
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
        {/* Image Mode */}
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
                className="w-full h-full object-fill"
              />
            )}
          </div>
        ) : config.display_mode === 'scraped' ? (
          /* Scraped Mode - Pharmacy List */
          <div className="w-full h-full overflow-y-auto p-6">
            {scrapingError ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <p className="text-2xl text-red-600">{scrapingError}</p>
                </div>
              </div>
            ) : pharmacies.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-xl text-gray-600">Caricamento farmacie...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {pharmacies.slice(0, 5).map((pharmacy, index) => (
                  <div
                    key={index}
                    className="border-2 border-l-4 rounded p-3 flex items-center gap-3"
                    style={{
                      borderLeftColor: pharmacy.status === 'TURNO' ? colors.primary : colors.secondary,
                      borderColor: colors.border,
                      backgroundColor: config.theme === 'dark' ? '#2a2a2a' : '#f9fafb'
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold leading-tight" style={{ color: colors.text }}>
                        {pharmacy.name}
                      </h3>
                      <p className="text-sm opacity-75 mt-0.5" style={{ color: colors.text }}>
                        📍 {pharmacy.address}, {pharmacy.postal_code} {pharmacy.city} ({pharmacy.province})
                        {pharmacy.distance_km && <span className="ml-1.5">• {pharmacy.distance_km} km</span>}
                      </p>
                      <div className="flex flex-col gap-0.5 mt-1 text-sm">
                        {pharmacy.opening_hours && (
                          <div style={{ color: colors.text }}>
                            🕐 Apertura: {pharmacy.opening_hours}
                          </div>
                        )}
                        {pharmacy.shift_hours && (
                          <div style={{ color: colors.text }}>
                            🔄 Turno: {pharmacy.shift_hours}
                          </div>
                        )}
                        {pharmacy.phone && (
                          <div className="font-semibold" style={{ color: colors.text }}>
                            📞 {pharmacy.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* QR Code for navigation */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-center leading-tight" style={{ color: colors.text }}>
                        Scansiona<br/>per<br/>navigare
                      </span>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`https://www.google.com/maps/search/?api=1&query=${pharmacy.name} ${pharmacy.address} ${pharmacy.city}`)}`}
                        alt="QR Code"
                        className="w-20 h-20"
                      />
                    </div>

                    {/* Status badge */}
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold text-white flex-shrink-0"
                      style={{
                        backgroundColor: pharmacy.status === 'TURNO' ? colors.primary : colors.secondary
                      }}
                    >
                      {pharmacy.status}
                    </span>
                  </div>
                ))}
              </div>
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
