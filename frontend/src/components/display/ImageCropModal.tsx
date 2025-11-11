import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface Props {
  imageFile: File;
  targetAspect: number; // Target aspect ratio (e.g., 3/4 for vertical 4:3)
  onSave: (croppedFile: File) => void;
  onCancel: () => void;
}

export const ImageCropModal: React.FC<Props> = ({ imageFile, targetAspect, onSave, onCancel }) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [saving, setSaving] = useState(false);

  // Load image from file
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Initialize crop when image loads
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const imageAspect = width / height;

    // Set initial crop to match target aspect ratio
    let cropWidth, cropHeight, cropX, cropY;

    if (imageAspect > targetAspect) {
      // Image is wider than target - crop width
      cropHeight = 90;
      cropWidth = (cropHeight / 100 * height * targetAspect / width) * 100;
      cropX = (100 - cropWidth) / 2;
      cropY = 5;
    } else {
      // Image is taller than target - crop height
      cropWidth = 90;
      cropHeight = (cropWidth / 100 * width / targetAspect / height) * 100;
      cropY = (100 - cropHeight) / 2;
      cropX = 5;
    }

    setCrop({
      unit: '%',
      width: cropWidth,
      height: cropHeight,
      x: cropX,
      y: cropY
    });
  };

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    setSaving(true);

    try {
      const image = imgRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        throw new Error('No 2d context');
      }

      // Calculate scale factors
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Calculate target dimensions
      // For 17" 4:3 monitor rotated (1024x768 becomes 768x1024)
      // We want maximum quality, so use natural resolution up to reasonable limit
      const maxWidth = 1200; // Good balance between quality and file size
      const maxHeight = maxWidth / targetAspect; // Maintain 3:4 aspect ratio

      let targetWidth = completedCrop.width * scaleX;
      let targetHeight = completedCrop.height * scaleY;

      // Scale down if too large
      if (targetWidth > maxWidth || targetHeight > maxHeight) {
        const scale = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
        targetWidth *= scale;
        targetHeight *= scale;
      }

      // Set canvas to target size (optimized for display)
      canvas.width = Math.round(targetWidth);
      canvas.height = Math.round(targetHeight);

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill white background (for JPEGs)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply transformations if needed
      if (rotation !== 0 || scale !== 1) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      // Draw cropped and scaled image
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      if (rotation !== 0 || scale !== 1) {
        ctx.restore();
      }

      // Convert canvas to blob with high quality
      const mimeType = imageFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = mimeType === 'image/jpeg' ? 0.92 : undefined;

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob');
        }

        // Create new file with cropped image
        const fileName = imageFile.name.replace(/\.[^.]+$/, mimeType === 'image/png' ? '.png' : '.jpg');
        const croppedFile = new File([blob], fileName, {
          type: mimeType,
          lastModified: Date.now()
        });

        onSave(croppedFile);
      }, mimeType, quality);

    } catch (error) {
      console.error('Crop error:', error);
      alert('Errore durante il ritaglio dell\'immagine');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Ritaglia e Adatta Immagine</h2>
          <p className="text-sm text-gray-600 mt-1">
            Adatta l'immagine al formato del display (proporzione 3:4 verticale)
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Crop Area */}
            <div className="flex-1">
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[400px]">
                {imageSrc && (
                  <ReactCrop
                    crop={crop}
                    onChange={(c: Crop) => setCrop(c)}
                    onComplete={(c: PixelCrop) => setCompletedCrop(c)}
                    aspect={targetAspect}
                    className="max-h-[500px]"
                  >
                    <img
                      ref={imgRef}
                      src={imageSrc}
                      alt="Crop"
                      onLoad={onImageLoad}
                      style={{
                        transform: `scale(${scale}) rotate(${rotation}deg)`,
                        maxWidth: '100%',
                        maxHeight: '500px'
                      }}
                    />
                  </ReactCrop>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="lg:w-64 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rotazione: {rotation}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-180°</span>
                  <button
                    onClick={() => setRotation(0)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Reset
                  </button>
                  <span>+180°</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zoom: {scale.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5x</span>
                  <button
                    onClick={() => setScale(1)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Reset
                  </button>
                  <span>3x</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Istruzioni</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Trascina l'area di ritaglio per posizionarla</li>
                  <li>• Ridimensiona dai bordi per adattare</li>
                  <li>• Usa i controlli per ruotare e zoomare</li>
                  <li>• Le proporzioni sono bloccate al formato display</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <div className="bg-blue-50 rounded p-3">
                  <p className="text-xs text-gray-700">
                    <span className="font-semibold">Proporzione target:</span><br />
                    3:4 (verticale)<br />
                    Display 17" 4:3 ruotato
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !completedCrop}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
          >
            {saving ? 'Salvataggio...' : 'Applica Ritaglio'}
          </button>
        </div>

        {/* Hidden canvas for crop processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
