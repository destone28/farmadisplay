import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { ConfigurationForm } from '../components/display/ConfigurationForm';
import { DisplayPreview } from '../components/display/DisplayPreview';
import { displayConfigService } from '../services/displayConfigService';
import { DisplayConfig, DisplayConfigUpdate, PharmacyHours } from '../types/display';
import { Pharmacy } from '../types';
import { api } from '../lib/api';

export const BachecaPage: React.FC = () => {
  const { user } = useAuthStore();
  const [config, setConfig] = useState<DisplayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>('');

  // Live preview state - these track unsaved changes
  const [liveFormData, setLiveFormData] = useState<DisplayConfigUpdate>({});
  const [liveHours, setLiveHours] = useState<PharmacyHours>({});
  const [liveFooterBgColor, setLiveFooterBgColor] = useState<string>('#00A3E0');
  const [liveLogoPreview, setLiveLogoPreview] = useState<string | null>(null);
  const [liveImagePreview, setLiveImagePreview] = useState<string | null>(null);

  // Compute preview config - merges saved config with live changes
  const previewConfig = useMemo<DisplayConfig | null>(() => {
    if (!config) return null;

    return {
      ...config,
      pharmacy_name: liveFormData.pharmacy_name ?? config.pharmacy_name,
      subtitle_text: liveFormData.subtitle_text ?? config.subtitle_text,
      footer_text: liveFormData.footer_text ?? config.footer_text,
      theme: liveFormData.theme ?? config.theme,
      primary_color: liveFormData.primary_color ?? config.primary_color,
      secondary_color: liveFooterBgColor ?? config.secondary_color,
      display_mode: liveFormData.display_mode ?? config.display_mode,
      pharmacy_hours: Object.keys(liveHours).length > 0 ? JSON.stringify(liveHours) : config.pharmacy_hours,
      logo_path: liveLogoPreview ?? config.logo_path,
      image_path: liveImagePreview ?? config.image_path,
    };
  }, [config, liveFormData, liveHours, liveFooterBgColor, liveLogoPreview, liveImagePreview]);

  // Fetch user's pharmacies
  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const response = await api.get<{ items: Pharmacy[] }>('/pharmacies/', {
          params: { skip: 0, limit: 100 }
        });
        setPharmacies(response.data.items);

        // Auto-select first pharmacy
        if (response.data.items.length > 0) {
          setSelectedPharmacyId(response.data.items[0].id);
        }
      } catch (error) {
        console.error('Error fetching pharmacies:', error);
      }
    };

    if (user) {
      fetchPharmacies();
    }
  }, [user]);

  const loadConfig = async () => {
    if (!selectedPharmacyId) return;

    setLoading(true);
    try {
      const data = await displayConfigService.getConfig(selectedPharmacyId);
      setConfig(data);

      // Reset live state when config is loaded
      setLiveFormData({});
      setLiveHours({});
      setLiveFooterBgColor(data.secondary_color);
      setLiveLogoPreview(null);
      setLiveImagePreview(null);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Config doesn't exist yet
        setConfig(null);
        setLiveFormData({});
        setLiveHours({});
        setLiveFooterBgColor('#00A3E0');
        setLiveLogoPreview(null);
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Caricamento...</div>
      </div>
    );
  }

  if (pharmacies.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600">Nessuna farmacia trovata</p>
          <p className="text-sm text-gray-400 mt-2">Crea prima una farmacia dalla dashboard</p>
        </div>
      </div>
    );
  }

  const openPublicDisplay = () => {
    if (selectedPharmacyId) {
      window.open(`/display/${selectedPharmacyId}`, '_blank');
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Compact Header in one line */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Configurazione Bacheca Display</h1>

          {/* Pharmacy Selector */}
          {pharmacies.length > 1 && (
            <select
              value={selectedPharmacyId}
              onChange={(e) => setSelectedPharmacyId(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {pharmacies.map((pharmacy) => (
                <option key={pharmacy.id} value={pharmacy.id}>
                  {pharmacy.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedPharmacyId && (
          <button
            onClick={openPublicDisplay}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Apri Display Pubblico
          </button>
        )}
      </div>

      {/* Main Content - 3/4 form, 1/4 preview */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left: Configuration Form (3/4) */}
        <div className="w-3/4">
          <ConfigurationForm
            pharmacyId={selectedPharmacyId}
            config={config}
            onUpdate={loadConfig}
            liveFormData={liveFormData}
            onLiveFormDataChange={setLiveFormData}
            liveHours={liveHours}
            onLiveHoursChange={setLiveHours}
            liveFooterBgColor={liveFooterBgColor}
            onLiveFooterBgColorChange={setLiveFooterBgColor}
            onLiveLogoPreview={setLiveLogoPreview}
            onLiveImagePreview={setLiveImagePreview}
          />
        </div>

        {/* Right: Preview (1/4) */}
        <div className="w-1/4">
          <DisplayPreview config={previewConfig} isLivePreview={true} />
        </div>
      </div>
    </div>
  );
};
