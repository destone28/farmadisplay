import React, { useState, useEffect } from 'react';
import { DisplayConfig, DisplayConfigUpdate, DisplayMode, PharmacyHours } from '../../types/display';
import { Pharmacy } from '../../types';
import { displayConfigService } from '../../services/displayConfigService';
import { ImageCropModal } from './ImageCropModal';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker - use local worker with Vite
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

interface Props {
  pharmacyId: string;
  pharmacy: Pharmacy | null;
  config: DisplayConfig | null;
  onUpdate: () => void;
  // Live preview props
  liveFormData: DisplayConfigUpdate;
  onLiveFormDataChange: (data: DisplayConfigUpdate) => void;
  liveHours: PharmacyHours;
  onLiveHoursChange: (hours: PharmacyHours) => void;
  liveFooterBgColor: string;
  onLiveFooterBgColorChange: (color: string) => void;
  onLiveLogoPreview: (url: string | null) => void;
  onLiveImagePreview: (url: string | null) => void;
}

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

// Color Palette Component - 8 colors in 2 rows
const ColorPalette: React.FC<{
  selectedColor: string;
  onColorSelect: (color: string) => void;
  label: string;
}> = ({ selectedColor, onColorSelect, label }) => {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="grid grid-cols-4 gap-1">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => onColorSelect(color.value)}
            className={`w-full h-[22px] rounded border-2 transition-all hover:scale-105 relative ${
              selectedColor === color.value ? 'border-gray-900 ring-1 ring-gray-400' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color.value }}
            title={color.name}
          >
            {selectedColor === color.value && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-3 h-3 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export const ConfigurationForm: React.FC<Props> = ({
  pharmacyId,
  pharmacy,
  config,
  onUpdate,
  onLiveFormDataChange,
  onLiveHoursChange,
  onLiveFooterBgColorChange,
  onLiveLogoPreview,
  onLiveImagePreview
}) => {
  // Local state for form data (merged with config defaults)
  const [formData, setFormData] = useState<DisplayConfigUpdate>({
    pharmacy_name: config?.pharmacy_name || '',
    subtitle_text: config?.subtitle_text || 'Farmacie di turno',
    display_mode: config?.display_mode || DisplayMode.IMAGE,
    footer_text: config?.footer_text || '',
    theme: config?.theme || 'light',
    primary_color: config?.primary_color || '#0066CC',
    scraping_cap: config?.scraping_cap || pharmacy?.postal_code || '',
    scraping_city: config?.scraping_city || pharmacy?.city || ''
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
        onLiveHoursChange(parsedHours);
      } catch {
        setHours({});
        onLiveHoursChange({});
      }
    }
  }, [config]);

  useEffect(() => {
    if (config) {
      const newFormData = {
        pharmacy_name: config.pharmacy_name,
        subtitle_text: config.subtitle_text,
        display_mode: config.display_mode,
        footer_text: config.footer_text || '',
        theme: config.theme,
        primary_color: config.primary_color,
        scraping_cap: config.scraping_cap || pharmacy?.postal_code || '',
        scraping_city: config.scraping_city || pharmacy?.city || ''
      };
      setFormData(newFormData);
      onLiveFormDataChange(newFormData);

      const newFooterColor = config.secondary_color || '#00A3E0';
      setFooterBgColor(newFooterColor);
      onLiveFooterBgColorChange(newFooterColor);
    }
  }, [config, pharmacy]);

  // Convert PDF first page to image
  const convertPdfToImage = async (pdfFile: File): Promise<File> => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();

      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      // Get first page
      const page = await pdf.getPage(1);

      // Calculate viewport to fit 3:4 aspect ratio (vertical display)
      const originalViewport = page.getViewport({ scale: 1.0 });

      // Scale to high quality but reasonable size (max 1200px width)
      let scale = 1200 / originalViewport.width;
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Impossibile creare il contesto canvas');
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      }).promise;

      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const imageName = pdfFile.name.replace(/\.pdf$/i, '.jpg');
            resolve(new File([blob], imageName, { type: 'image/jpeg' }));
          } else {
            reject(new Error('Errore nella conversione del canvas in immagine'));
          }
        }, 'image/jpeg', 0.92);
      });
    } catch (error) {
      console.error('Errore conversione PDF:', error);
      throw new Error(`Errore nella conversione del PDF: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSend = {
        ...formData,
        pharmacy_hours: Object.keys(hours).length > 0 ? JSON.stringify(hours) : null,
        secondary_color: footerBgColor
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
        onLiveLogoPreview(null); // Clear preview after upload
      }

      if (imageFile) {
        await displayConfigService.uploadImage(pharmacyId, imageFile);
        setImageFile(null);
        onLiveImagePreview(null); // Clear preview after upload
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size first
    if (file.size > 10 * 1024 * 1024) {
      alert('File troppo grande. Massimo 10MB.');
      e.target.value = ''; // Reset input
      return;
    }

    // Convert PDF to image
    if (file.type === 'application/pdf') {
      try {
        const imageFromPdf = await convertPdfToImage(file);

        // Check if converted image needs cropping
        await checkAndCropImage(imageFromPdf, type);
        alert('PDF convertito in immagine (prima pagina)');
      } catch (error) {
        console.error('PDF conversion error:', error);
        alert(error instanceof Error ? error.message : 'Errore nella conversione del PDF');
        e.target.value = ''; // Reset input
      }
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Tipo file non valido. Usa JPG, PNG o PDF.');
      e.target.value = ''; // Reset input
      return;
    }

    // Check if image needs cropping
    await checkAndCropImage(file, type);
  };

  // Helper function to check if image needs cropping
  const checkAndCropImage = async (file: File, type: 'logo' | 'image'): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.onload = () => {
          const imageAspect = img.width / img.height;
          const targetAspect = 3 / 4; // Vertical 4:3 display

          const aspectDiff = Math.abs(imageAspect - targetAspect) / targetAspect;

          // If aspect ratio difference > 5%, open crop modal
          if (aspectDiff > 0.05) {
            setCropModalFile(file);
            setCropModalType(type);
          } else {
            // Image aspect ratio is good, use as is
            if (type === 'logo') {
              setLogoFile(file);
              const previewUrl = URL.createObjectURL(file);
              onLiveLogoPreview(previewUrl);
            } else {
              setImageFile(file);
              const previewUrl = URL.createObjectURL(file);
              onLiveImagePreview(previewUrl);
            }
          }
          resolve();
        };

        img.onerror = () => {
          alert('Errore nel caricamento dell\'immagine');
          resolve();
        };

        img.src = event.target?.result as string;
      };

      reader.onerror = () => {
        alert('Errore nella lettura del file');
        resolve();
      };

      reader.readAsDataURL(file);
    });
  };

  const handleCropSave = (croppedFile: File) => {
    if (cropModalType === 'logo') {
      setLogoFile(croppedFile);
      // Create preview URL for logo
      const previewUrl = URL.createObjectURL(croppedFile);
      onLiveLogoPreview(previewUrl);
    } else if (cropModalType === 'image') {
      setImageFile(croppedFile);
      // Create preview URL for image
      const previewUrl = URL.createObjectURL(croppedFile);
      onLiveImagePreview(previewUrl);
    }
    setCropModalFile(null);
    setCropModalType(null);
  };

  const handleCropCancel = () => {
    setCropModalFile(null);
    setCropModalType(null);
  };

  // Helper to update form data and trigger live preview
  const updateFormData = (updates: Partial<DisplayConfigUpdate>) => {
    const newFormData = { ...formData, ...updates };
    setFormData(newFormData);
    onLiveFormDataChange(newFormData);
  };

  // Helper to update footer color and trigger live preview
  const updateFooterColor = (color: string) => {
    setFooterBgColor(color);
    onLiveFooterBgColorChange(color);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 rounded-lg shadow h-full overflow-y-auto">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="grid grid-cols-5 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Logo</label>
            {config?.logo_path && !logoFile && (
              <img src={`${import.meta.env.VITE_API_URL}${config.logo_path}`} alt="Logo" className="h-10 mb-1 object-contain border rounded p-1" />
            )}
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileChange(e, 'logo')} className="block w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700" />
            {logoFile && <p className="text-xs text-green-600 mt-1">Nuovo: {logoFile.name}</p>}
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Nome Farmacia *</label>
            <input type="text" required value={formData.pharmacy_name || ''} onChange={(e) => updateFormData({ pharmacy_name: e.target.value })} className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500" />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Tema</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateFormData({ theme: 'light' })}
                className={`flex-1 px-2 py-1.5 text-xs rounded border-2 transition ${formData.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                ☀️ Giorno
              </button>
              <button
                type="button"
                onClick={() => updateFormData({ theme: 'dark' })}
                className={`flex-1 px-2 py-1.5 text-xs rounded border-2 transition ${formData.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                🌙 Notte
              </button>
            </div>
          </div>
        </div>

        {/* Subtitle and Color Palette */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Messaggio in alto</label>
            <textarea value={formData.subtitle_text || ''} onChange={(e) => updateFormData({ subtitle_text: e.target.value })} rows={2} className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500" placeholder="Farmacie di turno" />
          </div>
          <ColorPalette
            selectedColor={formData.primary_color || '#0066CC'}
            onColorSelect={(color) => updateFormData({ primary_color: color })}
            label="Colore sfondo"
          />
        </div>

      </div>

      {/* Content Section */}
      <div className="space-y-2 border-t pt-2">
        <h3 className="text-sm font-semibold text-gray-700">Aggiorna la visualizzazione delle Farmacie di Turno</h3>

        {/* Display Mode Selection */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateFormData({ display_mode: DisplayMode.SCRAPED })}
            className={`flex-1 px-3 py-2 text-xs rounded border-2 transition ${formData.display_mode === DisplayMode.SCRAPED ? 'border-blue-500 bg-blue-50 font-semibold' : 'border-gray-200'}`}
          >
            🔄 Aggiorna automaticamente
          </button>
          <button
            type="button"
            onClick={() => updateFormData({ display_mode: DisplayMode.IMAGE })}
            className={`flex-1 px-3 py-2 text-xs rounded border-2 transition ${formData.display_mode === DisplayMode.IMAGE ? 'border-blue-500 bg-blue-50 font-semibold' : 'border-gray-200'}`}
          >
            📷 Carica immagine o PDF
          </button>
        </div>

        {/* Image Mode Fields */}
        {formData.display_mode === DisplayMode.IMAGE && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Immagine/PDF</label>
            {config?.image_path && !imageFile && (
              <div className="mb-2">
                <img src={`${import.meta.env.VITE_API_URL}${config.image_path}`} alt="Display" className="max-h-20 object-contain border rounded bg-white p-1" />
              </div>
            )}
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileChange(e, 'image')} className="block w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700" />
            {imageFile && <p className="text-xs text-green-600 mt-1">Nuovo: {imageFile.name}</p>}
            <p className="text-[10px] text-gray-500 mt-1">PDF: verrà convertito automaticamente (prima pagina)</p>
          </div>
        )}

      </div>

      {/* Footer Section */}
      <div className="space-y-2 border-t pt-2">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Messaggio in basso</label>
            <textarea value={formData.footer_text || ''} onChange={(e) => updateFormData({ footer_text: e.target.value })} rows={2} className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500" placeholder="Es: Per emergenze 118" />
          </div>
          <ColorPalette
            selectedColor={footerBgColor}
            onColorSelect={(color) => updateFooterColor(color)}
            label="Colore sfondo"
          />
        </div>
      </div>

      <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-sm transition mt-4">
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
