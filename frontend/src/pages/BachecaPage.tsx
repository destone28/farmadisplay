import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { ConfigurationForm } from '../components/display/ConfigurationForm';
import { DisplayPreview } from '../components/display/DisplayPreview';
import { displayConfigService } from '../services/displayConfigService';
import { DisplayConfig } from '../types/display';
import { Pharmacy } from '../types';
import { api } from '../lib/api';

export const BachecaPage: React.FC = () => {
  const { user } = useAuthStore();
  const [config, setConfig] = useState<DisplayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>('');

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
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Config doesn't exist yet
        setConfig(null);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Configurazione Bacheca Display</h1>

      {/* Pharmacy Selector (if multiple pharmacies) */}
      {pharmacies.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleziona Farmacia
          </label>
          <select
            value={selectedPharmacyId}
            onChange={(e) => setSelectedPharmacyId(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {pharmacies.map((pharmacy) => (
              <option key={pharmacy.id} value={pharmacy.id}>
                {pharmacy.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Form */}
        <div>
          <ConfigurationForm
            pharmacyId={selectedPharmacyId}
            config={config}
            onUpdate={loadConfig}
          />
        </div>

        {/* Display Preview */}
        <div className="lg:sticky lg:top-8 lg:h-screen">
          <DisplayPreview config={config} refreshInterval={10000} />
        </div>
      </div>
    </div>
  );
};
