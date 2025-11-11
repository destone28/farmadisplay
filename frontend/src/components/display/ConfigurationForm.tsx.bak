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
  { key: 'monday', label: 'Lun' },
  { key: 'tuesday', label: 'Mar' },
  { key: 'wednesday', label: 'Mer' },
  { key: 'thursday', label: 'Gio' },
  { key: 'friday', label: 'Ven' },
  { key: 'saturday', label: 'Sab' },
  { key: 'sunday', label: 'Dom' }
];

const PRESET_COLORS = [
  { name: 'Blu Farmacia', value: '#0066CC' },
  { name: 'Verde Croce', value: '#00A651' },
  { name: 'Rosso', value: '#DC143C' },
  { name: 'Arancione', value: '#FF6B35' },
  { name: 'Viola', value: '#6B46C1' },
  { name: 'Turchese', value: '#00A3E0' },
  { name: 'Verde Scuro', value: '#2D5016' },
  { name: 'Blu Scuro', value: '#003D82' }
];

export const ConfigurationForm: React.FC<Props> = ({ pharmacyId, config, onUpdate }) => {
  const [formData, setFormData] = useState<DisplayConfigUpdate>({
    pharmacy_name: config?.pharmacy_name || '',
    subtitle_text: config?.subtitle_text || 'Farmacie di turno',
    display_mode: config?.display_mode || DisplayMode.IMAGE,
    footer_text: config?.footer_text || '',
    theme: config?.theme || 'light',
    primary_color: config?.primary_color || '#0066CC'
  });

  const [hours, setHours] = useState<PharmacyHours>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [cropModalFile, setCropModalFile] = useState<File | null>(null);
  const [cropModalType, setCropModalType] = useState<'logo' | 'image' | null>(null);
  const [footerBgColor, setFooterBgColor] = useState<string>(config?.secondary_color || '#00A3E0');

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
        primary_color: config.primary_color
      });
      setFooterBgColor(config.secondary_color || '#00A3E0');
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSend = {
        ...formData,
        pharmacy_hours: Object.keys(hours).length > 0 ? JSON.stringify(hours) : null,
        secondary_color: footerBgColor // Use footer bg color as secondary
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
          secondary_color: footerBgColor
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
      alert('Configurazione pubblicata con successo!');
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
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow h-full overflow-y-auto">
      {/* Header Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Header</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Logo</label>
            {config?.logo_path && !logoFile && (
              <img src={`${import.meta.env.VITE_API_URL}${config.logo_path}`} alt="Logo" className="h-12 mb-1 object-contain border rounded p-1" />
            )}
            <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'logo')} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700" />
            {logoFile && <p className="text-xs text-green-600 mt-1">Nuovo: {logoFile.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nome Farmacia *</label>
            <input type="text" required value={formData.pharmacy_name || ''} onChange={(e) => setFormData({ ...formData, pharmacy_name: e.target.value })} className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>

        {/* Subtitle and Color */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Messaggio in alto</label>
            <input type="text" value={formData.subtitle_text || ''} onChange={(e) => setFormData({ ...formData, subtitle_text: e.target.value })} className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500" placeholder="Farmacie di turno" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Colore sfondo</label>
            <select value={formData.primary_color} onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })} className="w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500">
              {PRESET_COLORS.map(color => (
                <option key={color.value} value={color.value}>{color.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Theme Toggle */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tema</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, theme: 'light' })}
              className={`flex-1 px-3 py-2 text-xs rounded border-2 transition ${formData.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              ☀️ Giorno
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, theme: 'dark' })}
              className={`flex-1 px-3 py-2 text-xs rounded border-2 transition ${formData.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              🌙 Notte
            </button>
          </div>
        </div>

        {/* Hours - Compact */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Orari Settimanali (24h)</label>
          <div className="grid grid-cols-7 gap-1 text-xs">
            {DAYS.map(day => (
              <div key={day.key} className="text-center">
                <div className="font-medium text-gray-600 mb-1">{day.label}</div>
                <input
                  type="time"
                  value={hours[day.key as keyof PharmacyHours]?.open || ''}
                  onChange={(e) => updateHours(day.key, 'open', e.target.value)}
                  className="w-full px-1 py-0.5 border rounded text-xs"
                />
                <input
                  type="time"
                  value={hours[day.key as keyof PharmacyHours]?.close || ''}
                  onChange={(e) => updateHours(day.key, 'close', e.target.value)}
                  className="w-full px-1 py-0.5 border rounded text-xs mt-1"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-3 border-t pt-3">
        <h3 className="text-sm font-semibold text-gray-700">Contenuto</h3>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Immagine/PDF</label>
          {config?.image_path && !imageFile && (
            <div className="mb-2">
              {config.image_path.endsWith('.pdf') ? (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                  <span className="text-lg">📄</span>
                  <span>{config.image_path.split('/').pop()}</span>
                </div>
              ) : (
                <img src={`${import.meta.env.VITE_API_URL}${config.image_path}`} alt="Display" className="max-h-24 object-contain border rounded bg-white p-1" />
              )}
            </div>
          )}
          <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileChange(e, 'image')} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700" />
          {imageFile && <p className="text-xs text-green-600 mt-1">Nuovo: {imageFile.name}</p>}
        </div>
      </div>

      {/* Footer Section */}
      <div className="space-y-3 border-t pt-3">
        <h3 className="text-sm font-semibold text-gray-700">Footer</h3>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Messaggio in basso</label>
            <textarea value={formData.footer_text || ''} onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })} rows={2} className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500" placeholder="Es: Per emergenze 118" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Colore sfondo</label>
            <select value={footerBgColor} onChange={(e) => setFooterBgColor(e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500">
              {PRESET_COLORS.map(color => (
                <option key={color.value} value={color.value}>{color.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-2.5 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-sm transition">
        {saving ? 'Pubblicazione...' : 'Pubblica Configurazione'}
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
