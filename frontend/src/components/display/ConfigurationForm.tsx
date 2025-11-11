import React, { useState, useEffect } from 'react';
import { DisplayConfig, DisplayConfigUpdate, DisplayMode } from '../../types/display';
import { displayConfigService } from '../../services/displayConfigService';

interface Props {
  pharmacyId: string;
  config: DisplayConfig | null;
  onUpdate: () => void;
}

export const ConfigurationForm: React.FC<Props> = ({ pharmacyId, config, onUpdate }) => {
  const [formData, setFormData] = useState<DisplayConfigUpdate>({
    pharmacy_name: config?.pharmacy_name || '',
    pharmacy_hours: config?.pharmacy_hours || '',
    display_mode: config?.display_mode || DisplayMode.IMAGE,
    footer_text: config?.footer_text || '',
    background_color: config?.background_color || '#FFFFFF',
    text_color: config?.text_color || '#000000',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        pharmacy_name: config.pharmacy_name,
        pharmacy_hours: config.pharmacy_hours || '',
        display_mode: config.display_mode,
        footer_text: config.footer_text || '',
        background_color: config.background_color,
        text_color: config.text_color,
      });
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Create or update config
      if (!config) {
        await displayConfigService.createConfig({
          pharmacy_id: pharmacyId,
          pharmacy_name: formData.pharmacy_name || '',
          pharmacy_hours: formData.pharmacy_hours,
          display_mode: formData.display_mode,
          footer_text: formData.footer_text,
          background_color: formData.background_color,
          text_color: formData.text_color,
        });
      } else {
        await displayConfigService.updateConfig(pharmacyId, formData);
      }

      // Upload logo if selected
      if (logoFile) {
        await displayConfigService.uploadLogo(pharmacyId, logoFile);
        setLogoFile(null);
      }

      // Upload image if selected
      if (imageFile) {
        await displayConfigService.uploadImage(pharmacyId, imageFile);
        setImageFile(null);
      }

      onUpdate();
      alert('Configurazione salvata con successo!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Errore sconosciuto';
      alert(`Errore: ${errorMessage}`);
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'image') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Tipo file non valido. Usa JPG, PNG o PDF.');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File troppo grande. Massimo 10MB.');
        return;
      }

      if (type === 'logo') {
        setLogoFile(file);
      } else {
        setImageFile(file);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-900">Configurazione Bacheca</h2>

      {/* Header Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Header Display</h3>

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo Farmacia
          </label>
          {config?.logo_path && !logoFile && (
            <div className="mb-2">
              <img
                src={`${import.meta.env.VITE_API_URL}${config.logo_path}`}
                alt="Current logo"
                className="h-20 object-contain border rounded"
              />
            </div>
          )}
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={(e) => handleFileChange(e, 'logo')}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {logoFile && (
            <p className="mt-1 text-sm text-green-600">
              Nuovo file selezionato: {logoFile.name}
            </p>
          )}
        </div>

        {/* Pharmacy Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome Farmacia *
          </label>
          <input
            type="text"
            required
            value={formData.pharmacy_name || ''}
            onChange={(e) => setFormData({ ...formData, pharmacy_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Es: Farmacia Centrale"
          />
        </div>

        {/* Pharmacy Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Orari
          </label>
          <input
            type="text"
            value={formData.pharmacy_hours || ''}
            onChange={(e) => setFormData({ ...formData, pharmacy_hours: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Es: Lun-Ven: 8:30-19:30 | Sab: 9:00-13:00"
          />
        </div>
      </div>

      {/* Display Mode */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Modalità Visualizzazione</h3>

        <div className="flex flex-col space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value={DisplayMode.IMAGE}
              checked={formData.display_mode === DisplayMode.IMAGE}
              onChange={(e) => setFormData({ ...formData, display_mode: e.target.value as DisplayMode })}
              className="mr-2"
            />
            <span className="text-sm">Immagine/PDF Statico</span>
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              value={DisplayMode.SCRAPED}
              checked={formData.display_mode === DisplayMode.SCRAPED}
              onChange={(e) => setFormData({ ...formData, display_mode: e.target.value as DisplayMode })}
              className="mr-2"
              disabled
            />
            <span className="text-sm text-gray-400">Farmacie Online (Coming Soon)</span>
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              value={DisplayMode.MANUAL}
              checked={formData.display_mode === DisplayMode.MANUAL}
              onChange={(e) => setFormData({ ...formData, display_mode: e.target.value as DisplayMode })}
              className="mr-2"
              disabled
            />
            <span className="text-sm text-gray-400">Turni Manuali (Coming Soon)</span>
          </label>
        </div>

        {/* Image Upload (only if IMAGE mode) */}
        {formData.display_mode === DisplayMode.IMAGE && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Immagine/PDF Display
            </label>
            {config?.image_path && !imageFile && (
              <div className="mb-2">
                {config.image_path.endsWith('.pdf') ? (
                  <p className="text-sm text-gray-600">PDF: {config.image_path}</p>
                ) : (
                  <img
                    src={`${import.meta.env.VITE_API_URL}${config.image_path}`}
                    alt="Current display"
                    className="max-h-60 object-contain border rounded"
                  />
                )}
              </div>
            )}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => handleFileChange(e, 'image')}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {imageFile && (
              <p className="mt-1 text-sm text-green-600">
                Nuovo file selezionato: {imageFile.name}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer Configuration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Testo Footer
        </label>
        <textarea
          value={formData.footer_text || ''}
          onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Es: Per emergenze chiamare il 118"
        />
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Colore Sfondo
          </label>
          <input
            type="color"
            value={formData.background_color || '#FFFFFF'}
            onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Colore Testo
          </label>
          <input
            type="color"
            value={formData.text_color || '#000000'}
            onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {saving ? 'Salvataggio...' : 'Salva Configurazione'}
      </button>
    </form>
  );
};
