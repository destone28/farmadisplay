import React, { useState, useEffect } from 'react';
import { DisplayConfig, DisplayConfigUpdate, DisplayMode, PharmacyHours } from '../../types/display';
import { displayConfigService } from '../../services/displayConfigService';
import { ImageCropModal } from './ImageCropModal';

interface Props {
  pharmacyId: string;
  config: DisplayConfig | null;
  onUpdate: () => void;
}

const DAYS = [
  { key: 'monday', label: 'Lunedì' },
  { key: 'tuesday', label: 'Martedì' },
  { key: 'wednesday', label: 'Mercoledì' },
  { key: 'thursday', label: 'Giovedì' },
  { key: 'friday', label: 'Venerdì' },
  { key: 'saturday', label: 'Sabato' },
  { key: 'sunday', label: 'Domenica' }
];

export const ConfigurationForm: React.FC<Props> = ({ pharmacyId, config, onUpdate }) => {
  const [formData, setFormData] = useState<DisplayConfigUpdate>({
    pharmacy_name: config?.pharmacy_name || '',
    subtitle_text: config?.subtitle_text || 'Farmacie di turno',
    display_mode: config?.display_mode || DisplayMode.IMAGE,
    footer_text: config?.footer_text || '',
    theme: config?.theme || 'light',
    primary_color: config?.primary_color || '#0066CC',
    secondary_color: config?.secondary_color || '#00A3E0'
  });

  const [hours, setHours] = useState<PharmacyHours>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [cropModalFile, setCropModalFile] = useState<File | null>(null);
  const [cropModalType, setCropModalType] = useState<'logo' | 'image' | null>(null);

  // Parse hours from config
  useEffect(() => {
    if (config?.pharmacy_hours) {
      try {
        const parsedHours = JSON.parse(config.pharmacy_hours);
        setHours(parsedHours);
      } catch {
        setHours({});
      }
    }
  }, [config]);

  useEffect(() => {
    if (config) {
      setFormData({
        pharmacy_name: config.pharmacy_name,
        subtitle_text: config.subtitle_text,
        display_mode: config.display_mode,
        footer_text: config.footer_text || '',
        theme: config.theme,
        primary_color: config.primary_color,
        secondary_color: config.secondary_color
      });
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSend = {
        ...formData,
        pharmacy_hours: Object.keys(hours).length > 0 ? JSON.stringify(hours) : null
      };

      if (!config) {
        await displayConfigService.createConfig({
          pharmacy_id: pharmacyId,
          pharmacy_name: formData.pharmacy_name || '',
          subtitle_text: formData.subtitle_text,
          pharmacy_hours: dataToSend.pharmacy_hours,
          display_mode: formData.display_mode,
          footer_text: formData.footer_text,
          theme: formData.theme,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color
        });
      } else {
        await displayConfigService.updateConfig(pharmacyId, dataToSend);
      }

      if (logoFile) {
        await displayConfigService.uploadLogo(pharmacyId, logoFile);
        setLogoFile(null);
      }

      if (imageFile) {
        await displayConfigService.uploadImage(pharmacyId, imageFile);
        setImageFile(null);
      }

      onUpdate();
      alert('✅ Configurazione salvata con successo!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Errore sconosciuto';
      alert(`❌ Errore: ${errorMessage}`);
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'image') => {
    const file = e.target.files?.[0];
    if (file) {
      // Skip PDF files from cropping
      if (file.type === 'application/pdf') {
        if (file.size > 10 * 1024 * 1024) {
          alert('File troppo grande. Massimo 10MB.');
          return;
        }
        type === 'logo' ? setLogoFile(file) : setImageFile(file);
        return;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert('Tipo file non valido. Usa JPG o PNG per immagini, o PDF.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('File troppo grande. Massimo 10MB.');
        return;
      }

      // Check if image needs cropping
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.onload = () => {
          const imageAspect = img.width / img.height;
          const targetAspect = 3 / 4; // Vertical 4:3 display

          // If aspect ratio differs by more than 5%, open crop modal
          const aspectDiff = Math.abs(imageAspect - targetAspect) / targetAspect;

          if (aspectDiff > 0.05) {
            // Open crop modal
            setCropModalFile(file);
            setCropModalType(type);
          } else {
            // Aspect ratio is close enough, use directly
            type === 'logo' ? setLogoFile(file) : setImageFile(file);
          }
        };
        img.src = event.target?.result as string;
      };

      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = (croppedFile: File) => {
    if (cropModalType === 'logo') {
      setLogoFile(croppedFile);
    } else if (cropModalType === 'image') {
      setImageFile(croppedFile);
    }
    setCropModalFile(null);
    setCropModalType(null);
  };

  const handleCropCancel = () => {
    setCropModalFile(null);
    setCropModalType(null);
  };

  const updateHours = (day: string, field: 'open' | 'close', value: string) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof PharmacyHours], [field]: value }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow max-h-[calc(100vh-8rem)] overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-900 sticky top-0 bg-white pb-2 border-b">Configurazione Bacheca</h2>

      {/* Header Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center">
          <span className="mr-2">📋</span> Header Display
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo Farmacia</label>
          {config?.logo_path && !logoFile && (
            <img src={`${import.meta.env.VITE_API_URL}${config.logo_path}`} alt="Logo" className="h-16 mb-2 object-contain border rounded p-2" />
          )}
          <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'logo')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          {logoFile && <p className="text-sm text-green-600 mt-1">✓ Nuovo: {logoFile.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome Farmacia *</label>
          <input type="text" required value={formData.pharmacy_name || ''} onChange={(e) => setFormData({ ...formData, pharmacy_name: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Es: Farmacia Centrale" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sottotitolo Bacheca</label>
          <input type="text" value={formData.subtitle_text || ''} onChange={(e) => setFormData({ ...formData, subtitle_text: e.target.value })} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Farmacie di turno" />
          <p className="text-xs text-gray-500 mt-1">Appare sotto l'header con colore primario</p>
        </div>
      </div>

      {/* Hours Section */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center">
          <span className="mr-2">🕐</span> Orari Settimanali
        </h3>
        <p className="text-sm text-gray-600">L'orario del giorno corrente verrà mostrato nell'header</p>
        <div className="space-y-2">
          {DAYS.map(day => (
            <div key={day.key} className="grid grid-cols-4 gap-2 items-center">
              <span className="text-sm font-medium text-gray-700">{day.label}</span>
              <input type="time" value={hours[day.key as keyof PharmacyHours]?.open || ''} onChange={(e) => updateHours(day.key, 'open', e.target.value)} className="px-2 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500" placeholder="Apertura" />
              <span className="text-center text-gray-400">—</span>
              <input type="time" value={hours[day.key as keyof PharmacyHours]?.close || ''} onChange={(e) => updateHours(day.key, 'close', e.target.value)} className="px-2 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500" placeholder="Chiusura" />
            </div>
          ))}
        </div>
      </div>

      {/* Theme Section */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center">
          <span className="mr-2">🎨</span> Tema e Colori
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Tema Display</label>
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${formData.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" value="light" checked={formData.theme === 'light'} onChange={(e) => setFormData({ ...formData, theme: e.target.value as 'light' | 'dark' })} className="sr-only" />
              <div className="text-center">
                <div className="text-3xl mb-1">☀️</div>
                <div className="font-semibold">Chiaro</div>
                <div className="text-xs text-gray-500">Sfondo bianco</div>
              </div>
            </label>
            <label className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${formData.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" value="dark" checked={formData.theme === 'dark'} onChange={(e) => setFormData({ ...formData, theme: e.target.value as 'light' | 'dark' })} className="sr-only" />
              <div className="text-center">
                <div className="text-3xl mb-1">🌙</div>
                <div className="font-semibold">Scuro</div>
                <div className="text-xs text-gray-500">Sfondo nero</div>
              </div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Colore Primario</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={formData.primary_color || '#0066CC'} onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })} className="h-10 w-16 rounded cursor-pointer border" />
              <input type="text" value={formData.primary_color || '#0066CC'} onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })} className="flex-1 px-2 py-2 border rounded text-sm font-mono focus:ring-2 focus:ring-blue-500" pattern="^#[0-9A-Fa-f]{6}$" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Usato per sottotitolo</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Colore Secondario</label>
            <div className="flex gap-2 items-center">
              <input type="color" value={formData.secondary_color || '#00A3E0'} onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })} className="h-10 w-16 rounded cursor-pointer border" />
              <input type="text" value={formData.secondary_color || '#00A3E0'} onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })} className="flex-1 px-2 py-2 border rounded text-sm font-mono focus:ring-2 focus:ring-blue-500" pattern="^#[0-9A-Fa-f]{6}$" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Riservato per usi futuri</p>
          </div>
        </div>
      </div>

      {/* Display Mode */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center">
          <span className="mr-2">🖼️</span> Contenuto Display
        </h3>

        <div className="flex flex-col space-y-2">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="radio" value={DisplayMode.IMAGE} checked={formData.display_mode === DisplayMode.IMAGE} onChange={(e) => setFormData({ ...formData, display_mode: e.target.value as DisplayMode })} className="mr-3" />
            <div>
              <div className="font-medium">Immagine/PDF Statico</div>
              <div className="text-xs text-gray-500">Carica la tua immagine o PDF personalizzato</div>
            </div>
          </label>
          <label className="flex items-center p-3 border rounded-lg opacity-50 cursor-not-allowed">
            <input type="radio" disabled className="mr-3" />
            <div>
              <div className="font-medium">Farmacie Online (Coming Soon)</div>
              <div className="text-xs text-gray-500">Dati da farmaciediturno.org</div>
            </div>
          </label>
          <label className="flex items-center p-3 border rounded-lg opacity-50 cursor-not-allowed">
            <input type="radio" disabled className="mr-3" />
            <div>
              <div className="font-medium">Turni Manuali (Coming Soon)</div>
              <div className="text-xs text-gray-500">Gestione turni dalla dashboard</div>
            </div>
          </label>
        </div>

        {formData.display_mode === DisplayMode.IMAGE && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">Immagine/PDF Display</label>
            {config?.image_path && !imageFile && (
              <div className="mb-3">
                {config.image_path.endsWith('.pdf') ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded border">
                    <span className="text-2xl">📄</span>
                    <span>PDF: {config.image_path.split('/').pop()}</span>
                  </div>
                ) : (
                  <img src={`${import.meta.env.VITE_API_URL}${config.image_path}`} alt="Display" className="max-h-40 object-contain border rounded bg-white p-2" />
                )}
              </div>
            )}
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileChange(e, 'image')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            {imageFile && <p className="text-sm text-green-600 mt-2">✓ Nuovo: {imageFile.name}</p>}
            <p className="text-xs text-gray-500 mt-2">Formati: JPG, PNG, PDF | Max 10MB</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <span className="mr-2">📝</span> Testo Footer
        </label>
        <textarea value={formData.footer_text || ''} onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500" placeholder="Es: Per emergenze chiamare il 118" />
        <p className="text-xs text-gray-500 mt-1">Appare in fondo al display</p>
      </div>

      <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-lg shadow-md disabled:cursor-not-allowed transition">
        {saving ? '💾 Salvataggio...' : '✅ Salva Configurazione'}
      </button>

      {/* Crop Modal */}
      {cropModalFile && (
        <ImageCropModal
          imageFile={cropModalFile}
          targetAspect={3 / 4}
          onSave={handleCropSave}
          onCancel={handleCropCancel}
        />
      )}
    </form>
  );
};
