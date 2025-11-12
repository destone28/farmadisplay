import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreatePharmacy, useUpdatePharmacy } from '@/hooks/usePharmacies'
import type { Pharmacy, PharmacyCreate } from '@/types'
import { api } from '@/lib/api'

const pharmacySchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
})

interface PharmacyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pharmacy?: Pharmacy
}

export default function PharmacyDialog({ open, onOpenChange, pharmacy }: PharmacyDialogProps) {
  const createPharmacy = useCreatePharmacy()
  const updatePharmacy = useUpdatePharmacy()
  const isEditing = !!pharmacy

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PharmacyCreate>({
    resolver: zodResolver(pharmacySchema),
    defaultValues: pharmacy || {},
  })

  useEffect(() => {
    if (open) {
      reset(pharmacy || {})
      setLogoFile(null)
      setLogoPreview(pharmacy?.logo_path ? `${import.meta.env.VITE_API_URL}${pharmacy.logo_path}` : null)
    }
  }, [open, pharmacy, reset])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        alert('Solo immagini JPG o PNG sono supportate')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Il file deve essere inferiore a 5MB')
        return
      }

      setLogoFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadLogo = async (pharmacyId: string) => {
    if (!logoFile) return

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', logoFile)

      await api.post(`/pharmacies/${pharmacyId}/upload-logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      throw error
    } finally {
      setUploadingLogo(false)
    }
  }

  const onSubmit = async (data: PharmacyCreate) => {
    try {
      let pharmacyId: string

      if (isEditing) {
        await updatePharmacy.mutateAsync({ id: pharmacy.id, data })
        pharmacyId = pharmacy.id
      } else {
        const result = await createPharmacy.mutateAsync(data)
        pharmacyId = result.id
      }

      // Upload logo if a new file was selected
      if (logoFile) {
        await uploadLogo(pharmacyId)
      }

      onOpenChange(false)
      reset()
      setLogoFile(null)
      setLogoPreview(null)
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Errore durante il salvataggio')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifica Farmacia' : 'Nuova Farmacia'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica le informazioni della farmacia'
              : 'Aggiungi una nuova farmacia al sistema'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Farmacia Centrale"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Città</Label>
              <Input
                id="city"
                placeholder="Milano"
                {...register('city')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">CAP</Label>
              <Input
                id="postal_code"
                placeholder="20100"
                {...register('postal_code')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Indirizzo</Label>
            <Input
              id="address"
              placeholder="Via Roma 1"
              {...register('address')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+39 02 1234567"
                {...register('phone')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="info@farmacia.it"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo Farmacia</Label>
            <Input
              id="logo"
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleLogoChange}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Formati supportati: JPG, PNG (max 5MB)
            </p>

            {/* Logo Preview */}
            {logoPreview && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-2">Anteprima:</p>
                <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || uploadingLogo}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting || uploadingLogo}>
              {isSubmitting || uploadingLogo ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {uploadingLogo ? 'Caricamento logo...' : 'Salvataggio...'}
                </>
              ) : isEditing ? (
                'Salva Modifiche'
              ) : (
                'Crea Farmacia'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
