import { useEffect } from 'react'
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

const pharmacySchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  logo_url: z.string().url('URL non valido').optional().or(z.literal('')),
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
    }
  }, [open, pharmacy, reset])

  const onSubmit = async (data: PharmacyCreate) => {
    try {
      if (isEditing) {
        await updatePharmacy.mutateAsync({ id: pharmacy.id, data })
      } else {
        await createPharmacy.mutateAsync(data)
      }
      onOpenChange(false)
      reset()
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
            <Label htmlFor="logo_url">URL Logo</Label>
            <Input
              id="logo_url"
              type="url"
              placeholder="https://example.com/logo.png"
              {...register('logo_url')}
            />
            {errors.logo_url && (
              <p className="text-sm text-destructive">{errors.logo_url.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Salvataggio...
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
