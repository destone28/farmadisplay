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
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers'
import type { User, UserCreate, UserUpdate } from '@/types'

const userCreateSchema = z.object({
  username: z.string().min(3, 'Username deve essere almeno 3 caratteri').max(50, 'Username troppo lungo'),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  phone: z.string().max(20, 'Telefono troppo lungo').optional().or(z.literal('')),
  city: z.string().max(100, 'Città troppo lunga').optional().or(z.literal('')),
  postal_code: z.string().max(10, 'CAP troppo lungo').optional().or(z.literal('')),
  address: z.string().max(500, 'Indirizzo troppo lungo').optional().or(z.literal('')),
  password: z.string()
    .min(8, 'Password deve essere almeno 8 caratteri')
    .regex(/[A-Z]/, 'Password deve contenere almeno una maiuscola')
    .regex(/[a-z]/, 'Password deve contenere almeno una minuscola')
    .regex(/[0-9]/, 'Password deve contenere almeno un numero'),
  role: z.enum(['admin', 'user']).default('user'),
})

const userUpdateSchema = z.object({
  username: z.string().min(3, 'Username deve essere almeno 3 caratteri').max(50, 'Username troppo lungo').optional(),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  phone: z.string().max(20, 'Telefono troppo lungo').optional().or(z.literal('')),
  city: z.string().max(100, 'Città troppo lunga').optional().or(z.literal('')),
  postal_code: z.string().max(10, 'CAP troppo lungo').optional().or(z.literal('')),
  address: z.string().max(500, 'Indirizzo troppo lungo').optional().or(z.literal('')),
  role: z.enum(['admin', 'user']).optional(),
  is_active: z.union([z.boolean(), z.string()]).optional(),
  password: z.string()
    .min(8, 'Password deve essere almeno 8 caratteri')
    .regex(/[A-Z]/, 'Password deve contenere almeno una maiuscola')
    .regex(/[a-z]/, 'Password deve contenere almeno una minuscola')
    .regex(/[0-9]/, 'Password deve contenere almeno un numero')
    .optional()
    .or(z.literal('')),
})

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User
}

export default function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const isEditing = !!user

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserCreate | UserUpdate>({
    resolver: zodResolver(isEditing ? userUpdateSchema : userCreateSchema),
    defaultValues: user || { role: 'user' },
  })

  useEffect(() => {
    if (open) {
      // Convert boolean is_active to string for the select field
      const userData = user ? {
        ...user,
        is_active: user.is_active ? 'true' : 'false'
      } : { role: 'user' }
      reset(userData)
    }
  }, [open, user, reset])

  const onSubmit = async (data: UserCreate | UserUpdate) => {
    try {
      // Convert is_active string to boolean if it exists
      const processedData = { ...data }
      if (isEditing && 'is_active' in processedData) {
        processedData.is_active = processedData.is_active === 'true' || processedData.is_active === true
      }

      // Remove password field if empty (for update only)
      if (isEditing && 'password' in processedData && !processedData.password) {
        delete processedData.password
      }

      if (isEditing) {
        await updateUser.mutateAsync({ id: user.id, data: processedData as UserUpdate })
      } else {
        await createUser.mutateAsync(processedData as UserCreate)
      }

      onOpenChange(false)
      reset()
    } catch (error: any) {
      console.error('Error saving user:', error)

      // Extract error message from various formats
      let errorMessage = 'Errore durante il salvataggio'

      if (error.response?.data?.detail) {
        // Backend validation error
        if (Array.isArray(error.response.data.detail)) {
          // Pydantic validation errors
          errorMessage = error.response.data.detail
            .map((err: any) => `${err.loc?.join(' → ') || 'Campo'}: ${err.msg}`)
            .join('\n')
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail
        } else {
          errorMessage = JSON.stringify(error.response.data.detail)
        }
      } else if (error.message && typeof error.message === 'string') {
        errorMessage = error.message
      }

      alert(errorMessage)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifica Utente' : 'Nuovo Utente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica le informazioni dell\'utente'
              : 'Aggiungi un nuovo utente al sistema'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              placeholder="mario.rossi"
              {...register('username')}
            />
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimo 8 caratteri, almeno una maiuscola, una minuscola e un numero
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="password">
                Nuova Password <span className="text-xs text-muted-foreground">(opzionale)</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Lascia vuoto per non modificare"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Compila solo se vuoi cambiare la password. Minimo 8 caratteri, almeno una maiuscola, una minuscola e un numero
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">
              Ruolo <span className="text-destructive">*</span>
            </Label>
            <select
              id="role"
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              {...register('role')}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="mario.rossi@email.it"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+39 333 1234567"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
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
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">CAP</Label>
              <Input
                id="postal_code"
                placeholder="20100"
                {...register('postal_code')}
              />
              {errors.postal_code && (
                <p className="text-sm text-destructive">{errors.postal_code.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Indirizzo</Label>
            <Input
              id="address"
              placeholder="Via Roma 1"
              {...register('address')}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="is_active">Stato</Label>
              <select
                id="is_active"
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                {...register('is_active')}
              >
                <option value="true">Attivo</option>
                <option value="false">Inattivo</option>
              </select>
            </div>
          )}

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
                'Crea Utente'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
