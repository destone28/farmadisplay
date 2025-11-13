import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { User, Mail, Phone, MapPin, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateProfile, useChangePassword } from '@/hooks/useProfile'
import type { ProfileUpdate, PasswordChange } from '@/types'

const profileSchema = z.object({
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  phone: z.string().max(20, 'Telefono troppo lungo').optional().or(z.literal('')),
  city: z.string().max(100, 'Città troppo lunga').optional().or(z.literal('')),
  postal_code: z.string().max(10, 'CAP troppo lungo').optional().or(z.literal('')),
  address: z.string().max(500, 'Indirizzo troppo lungo').optional().or(z.literal('')),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Password corrente richiesta'),
  new_password: z.string()
    .min(8, 'Password deve essere almeno 8 caratteri')
    .regex(/[A-Z]/, 'Password deve contenere almeno una maiuscola')
    .regex(/[a-z]/, 'Password deve contenere almeno una minuscola')
    .regex(/[0-9]/, 'Password deve contenere almeno un numero'),
})

export default function ProfilePage() {
  const { user } = useAuth()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileUpdate>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email || '',
      phone: user?.phone || '',
      city: user?.city || '',
      postal_code: user?.postal_code || '',
      address: user?.address || '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<PasswordChange>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
    },
  })

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        postal_code: user.postal_code || '',
        address: user.address || '',
      })
    }
  }, [user, reset])

  const onSubmit = async (data: ProfileUpdate) => {
    try {
      await updateProfile.mutateAsync(data)
      alert('Profilo aggiornato con successo!')
    } catch (error: any) {
      console.error('Error updating profile:', error)

      // Extract error message
      let errorMessage = 'Errore durante l\'aggiornamento del profilo'

      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map((err: any) => `${err.loc?.join(' → ') || 'Campo'}: ${err.msg}`)
            .join('\n')
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail
        }
      }

      alert(errorMessage)
    }
  }

  const onSubmitPassword = async (data: PasswordChange) => {
    try {
      await changePassword.mutateAsync(data)
      resetPassword()
      alert('Password modificata con successo!')
    } catch (error: any) {
      console.error('Error changing password:', error)

      // Extract error message
      let errorMessage = 'Errore durante il cambio password'

      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map((err: any) => `${err.loc?.join(' → ') || 'Campo'}: ${err.msg}`)
            .join('\n')
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail
        }
      }

      alert(errorMessage)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm sm:text-base text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Il Mio Profilo</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Gestisci le tue informazioni personali
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Account</CardTitle>
            <CardDescription>
              Username e ruolo non possono essere modificati
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Username</Label>
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{user.username}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ruolo</Label>
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                  <div
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Membro dal</Label>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                {new Date(user.created_at).toLocaleDateString('it-IT', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Edit Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Personali</CardTitle>
            <CardDescription>
              Aggiorna le tue informazioni di contatto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </Label>
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
                <Label htmlFor="phone">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefono
                  </div>
                </Label>
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
                  <Label htmlFor="city">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Città
                    </div>
                  </Label>
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

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => reset()}
                  disabled={!isDirty || isSubmitting}
                  className="flex-1 sm:flex-initial"
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={!isDirty || isSubmitting}
                  className="flex-1 sm:flex-initial"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Salvataggio...
                    </>
                  ) : (
                    'Salva Modifiche'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sicurezza</CardTitle>
            <CardDescription>
              Modifica la tua password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password Corrente
                  </div>
                </Label>
                <Input
                  id="current_password"
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword('current_password')}
                />
                {passwordErrors.current_password && (
                  <p className="text-sm text-destructive">{passwordErrors.current_password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Nuova Password
                  </div>
                </Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword('new_password')}
                />
                {passwordErrors.new_password && (
                  <p className="text-sm text-destructive">{passwordErrors.new_password.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimo 8 caratteri, almeno una maiuscola, una minuscola e un numero
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resetPassword()}
                  disabled={isSubmittingPassword}
                  className="flex-1 sm:flex-initial"
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="flex-1 sm:flex-initial"
                >
                  {isSubmittingPassword ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Modifica...
                    </>
                  ) : (
                    'Cambia Password'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
