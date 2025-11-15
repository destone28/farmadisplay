import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { ConfigurationForm } from '../components/display/ConfigurationForm';
import { DisplayPreview } from '../components/display/DisplayPreview';
import { DeviceControl } from '../components/devices/DeviceControl';
import { displayConfigService } from '../services/displayConfigService';
import { DisplayConfig, DisplayConfigUpdate, PharmacyHours } from '../types/display';
import { Pharmacy } from '../types';
import { api } from '../lib/api';
import { ExternalLink } from 'lucide-react';

export const BachecaPage: React.FC = () => {
  const { user } = useAuthStore();
  const [config, setConfig] = useState<DisplayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  // Live preview state - these track unsaved changes
  const [liveFormData, setLiveFormData] = useState<DisplayConfigUpdate>({});
  const [liveHours, setLiveHours] = useState<PharmacyHours>({});
  const [liveFooterBgColor, setLiveFooterBgColor] = useState<string>('#00A3E0');
  const [liveImagePreview, setLiveImagePreview] = useState<string | null>(null);

  // Get selected pharmacy
  const selectedPharmacy = useMemo(() => {
    return pharmacies.find(p => p.id === selectedPharmacyId) || null;
  }, [pharmacies, selectedPharmacyId]);

  // Compute preview config - merges saved config with live changes
  const previewConfig = useMemo<DisplayConfig | null>(() => {
    if (!config) return null;

    return {
      ...config,
      pharmacy_name: selectedPharmacy?.name ?? config.pharmacy_name,
      subtitle_text: liveFormData.subtitle_text ?? config.subtitle_text,
      footer_text: liveFormData.footer_text ?? config.footer_text,
      theme: liveFormData.theme ?? config.theme,
      primary_color: liveFormData.primary_color ?? config.primary_color,
      secondary_color: liveFooterBgColor ?? config.secondary_color,
      display_mode: liveFormData.display_mode ?? config.display_mode,
      pharmacy_hours: Object.keys(liveHours).length > 0 ? JSON.stringify(liveHours) : config.pharmacy_hours,
      logo_path: selectedPharmacy?.logo_path ?? config.logo_path,
      image_path: liveImagePreview ?? config.image_path,
      scraping_cap: liveFormData.scraping_cap ?? config.scraping_cap,
      scraping_city: liveFormData.scraping_city ?? config.scraping_city,
      scraping_province: liveFormData.scraping_province ?? config.scraping_province,
    };
  }, [config, liveFormData, liveHours, liveFooterBgColor, liveImagePreview, selectedPharmacy]);

  // Fetch user's pharmacies
  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const response = await api.get<{ items: Pharmacy[] }>('/pharmacies/', {
          params: { skip: 0, limit: 100 }
        });
        setPharmacies(response.data.items);

        if (response.data.items.length > 0) {
          setSelectedPharmacyId(response.data.items[0].id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching pharmacies:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchPharmacies();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadConfig = async () => {
    if (!selectedPharmacyId) return;

    setLoading(true);
    try {
      const data = await displayConfigService.getConfig(selectedPharmacyId);
      setConfig(data);

      setLiveFormData({});
      setLiveHours({});
      setLiveFooterBgColor(data.secondary_color);
      setLiveImagePreview(null);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setConfig(null);
        setLiveFormData({});
        setLiveHours({});
        setLiveFooterBgColor('#00A3E0');
        setLiveImagePreview(null);
      } else {
        console.error('Error loading config:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPharmacyId) {
      loadConfig();
    }
  }, [selectedPharmacyId]);

  if (loading && pharmacies.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen px-4">
        <div className="text-lg sm:text-xl">Caricamento...</div>
      </div>
    );
  }

  if (pharmacies.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen px-4">
        <div className="text-center">
          <p className="text-lg sm:text-xl text-gray-600">Nessuna farmacia trovata</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">Crea prima una farmacia dalla dashboard</p>
        </div>
      </div>
    );
  }

  const openPublicDisplay = () => {
    if (selectedPharmacy?.display_id) {
      window.open(`/display/${selectedPharmacy.display_id}`, '_blank');
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-4 py-3 sm:py-2 border-b bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Configurazione Bacheca</h1>

          {/* Pharmacy Selector */}
          {pharmacies.length > 1 && (
            <select
              value={selectedPharmacyId}
              onChange={(e) => setSelectedPharmacyId(e.target.value)}
              className="w-full sm:w-auto px-2 py-1.5 sm:py-1 border border-gray-300 rounded text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {pharmacies.map((pharmacy) => (
                <option key={pharmacy.id} value={pharmacy.id}>
                  {pharmacy.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Display ID */}
          {selectedPharmacy?.display_id && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded text-xs sm:text-sm border border-gray-300">
              <span className="text-gray-600 font-medium">ID Display:</span>
              <code className="font-mono font-bold text-blue-600">{selectedPharmacy.display_id}</code>
            </div>
          )}

          <div className="flex gap-2">
            {/* Mobile Preview Toggle */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex sm:hidden items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition flex-1"
            >
              {showPreview ? 'Nascondi' : 'Anteprima'}
            </button>

            {/* Open Public Display */}
            {selectedPharmacyId && (
              <button
                onClick={openPublicDisplay}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 transition flex-1 sm:flex-none"
              >
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Apri Display</span>
                <span className="sm:hidden">Display</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 p-3 sm:p-4 overflow-hidden">
        {/* Configuration Form - Full width on mobile, 3/4 on desktop */}
        <div className={`${showPreview ? 'hidden' : 'flex'} lg:flex lg:w-3/4 flex-col gap-4 overflow-auto`}>
          {/* Device Control Panel */}
          {selectedPharmacyId && (
            <div className="flex-shrink-0">
              <DeviceControl pharmacyId={selectedPharmacyId} />
            </div>
          )}

          {/* Configuration Form */}
          <div className="flex-1 min-h-0 overflow-auto">
            <ConfigurationForm
              pharmacyId={selectedPharmacyId}
              pharmacy={selectedPharmacy}
              config={config}
              onUpdate={loadConfig}
              liveFormData={liveFormData}
              onLiveFormDataChange={setLiveFormData}
              liveHours={liveHours}
              onLiveHoursChange={setLiveHours}
              liveFooterBgColor={liveFooterBgColor}
              onLiveFooterBgColorChange={setLiveFooterBgColor}
              onLiveImagePreview={setLiveImagePreview}
            />
          </div>
        </div>

        {/* Preview - Full width on mobile when shown, 1/4 on desktop always shown */}
        <div className={`${showPreview ? 'flex' : 'hidden'} lg:flex lg:w-1/4 flex-col gap-3 overflow-auto`}>
          <DisplayPreview config={previewConfig} pharmacy={selectedPharmacy} isLivePreview={true} />

          {/* Info notifications */}
          {previewConfig?.display_mode === 'scraped' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 sm:p-3">
              <p className="text-[10px] sm:text-xs text-blue-800 mb-1 sm:mb-1.5">
                📍 Questa modalità mostra automaticamente le farmacie di turno o aperte nella tua zona.
              </p>
              <p className="text-[9px] sm:text-[10px] text-blue-600">
                I dati vengono aggiornati automaticamente da farmaciediturno.org ogni 30 secondi.
              </p>
            </div>
          )}

          {previewConfig?.display_mode === 'image' && (
            <div className="bg-amber-50 border border-amber-200 rounded p-2 sm:p-3">
              <p className="text-[10px] sm:text-xs text-amber-800 mb-1 sm:mb-1.5">
                📷 Visualizzazione manuale delle farmacie di turno.
              </p>
              <p className="text-[9px] sm:text-[10px] text-amber-600">
                Le informazioni saranno mostrate attraverso l'immagine o PDF caricato manualmente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
