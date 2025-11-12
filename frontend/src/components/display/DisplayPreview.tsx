import React, { useEffect, useState } from 'react';
import { DisplayConfig } from '../../types/display';
import { scrapingService, PharmacyShiftInfo } from '../../services/scrapingService';
import { Pharmacy } from '../../types';

interface Props {
  config: DisplayConfig | null;
  pharmacy?: Pharmacy | null;
  refreshInterval?: number;
  isLivePreview?: boolean;
}

export const DisplayPreview: React.FC<Props> = ({ config, pharmacy, isLivePreview = false }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pharmacies, setPharmacies] = useState<PharmacyShiftInfo[]>([]);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch scraped pharmacies if in SCRAPED mode (for live preview)
  useEffect(() => {
    if (!config || config.display_mode !== 'scraped' || !isLivePreview) {
      setPharmacies([]);
      return;
    }

    const fetchPharmacies = async () => {
      if (!config.scraping_cap && !config.scraping_city) return;

      setLoadingPharmacies(true);
      try {
        const response = await scrapingService.searchPharmacies(
          config.scraping_cap || undefined,
          config.scraping_city || undefined
        );
        setPharmacies(response.pharmacies.slice(0, 3)); // Show only first 3 in preview
      } catch (err) {
        console.error('Error fetching pharmacies for preview:', err);
        setPharmacies([]);
      } finally {
        setLoadingPharmacies(false);
      }
    };

    fetchPharmacies();
  }, [config, isLivePreview]);

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

  // Parse weekly hours from pharmacy data
  const getTodayHoursDisplay = () => {
    if (!pharmacy?.opening_hours) return null;
    try {
      const weeklyHours = JSON.parse(pharmacy.opening_hours);
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = dayNames[currentTime.getDay()];
      const todaySchedule = weeklyHours[today];

      if (!todaySchedule || !todaySchedule.slots || todaySchedule.slots.length === 0) {
        return 'Oggi: Chiuso';
      }

      // Format all time slots for today
      const slots = todaySchedule.slots
        .map((slot: { open: string; close: string }) => `${slot.open}-${slot.close}`)
        .join(', ');

      return `Oggi: ${slots}`;
    } catch {
      // If not valid JSON or old format, just display as is
      return pharmacy.opening_hours ? `Orari: ${pharmacy.opening_hours}` : null;
    }
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
                {pharmacy?.logo_path && (
                  <div className="w-8 h-8 flex-shrink-0 mr-1.5">
                    <img
                      src={`${import.meta.env.VITE_API_URL}${pharmacy.logo_path}`}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-[11px] font-bold leading-tight truncate">{pharmacy?.name || config.pharmacy_name}</h1>
                  {getTodayHoursDisplay() && (
                    <p className="text-[9px] opacity-70 mt-0.5 truncate">{getTodayHoursDisplay()}</p>
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
            className="px-2 py-1 text-center font-semibold text-[10px]"
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
                    title="PDF Preview"
                  />
                ) : (
                  <img
                    src={config.image_path.startsWith('blob:') ? config.image_path : `${import.meta.env.VITE_API_URL}${config.image_path}`}
                    alt="Display"
                    className="w-full h-full object-fill"
                  />
                )}
              </div>
            ) : config.display_mode === 'scraped' ? (
              <div className="w-full h-full overflow-y-auto p-1">
                {loadingPharmacies ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b border-blue-600 mx-auto mb-1"></div>
                      <p className="text-[8px] text-gray-600">Caricamento...</p>
                    </div>
                  </div>
                ) : pharmacies.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center opacity-50">
                    <p className="text-[8px]">Configura CAP o città<br/>per vedere le farmacie</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {pharmacies.map((pharmacy, index) => (
                      <div
                        key={index}
                        className="border rounded p-1 text-[7px]"
                        style={{ borderColor: pharmacy.status === 'TURNO' ? colors.secondary : colors.primary }}
                      >
                        <div className="font-bold truncate text-[8px]">{pharmacy.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className="px-1 rounded text-[6px] font-bold text-white"
                            style={{ backgroundColor: pharmacy.status === 'TURNO' ? colors.secondary : colors.primary }}
                          >
                            {pharmacy.status}
                          </span>
                          {pharmacy.distance_km && (
                            <span className="text-[6px] opacity-60">📍 {pharmacy.distance_km}km</span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="text-[6px] text-center opacity-60 mt-1">
                      Mostra {pharmacies.length} di più farmacie
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-center opacity-50">
                <div>
                  <p className="text-[9px]">Nessuna immagine configurata</p>
                  <p className="text-[8px] mt-1">Carica un'immagine per visualizzarla</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {config.footer_text && (
            <div
              className="px-2 py-1 text-center text-[9px]"
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
