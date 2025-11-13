import { useState } from 'react'
import { Plus, Edit, Trash2, User as UserIcon, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUsers, useDeleteUser } from '@/hooks/useUsers'
import UserDialog from '@/components/users/UserDialog'
import type { User } from '@/types'

export default function UsersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>()
  const { data, isLoading } = useUsers()
  const deleteUser = useDeleteUser()

  const handleCreate = () => {
    setSelectedUser(undefined)
    setIsDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo utente?')) {
      try {
        await deleteUser.mutateAsync(id)
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Errore durante l\'eliminazione')
      }
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedUser(undefined)
  }

  if (isLoading) {
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Utenti</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gestisci gli utenti e le relative informazioni
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          <span>Nuovo Utente</span>
        </Button>
      </div>

      {data?.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <UserIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Nessun utente</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 text-center">
              Inizia aggiungendo il tuo primo utente
            </p>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Utente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg truncate">{user.username}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">
                      {user.city || 'Nessuna città'}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1 items-end flex-shrink-0">
                    <div
                      className={`rounded-full px-2 py-1 text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </div>
                    <div
                      className={`rounded-full px-2 py-1 text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                        user.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {user.is_active ? 'Attivo' : 'Inattivo'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                {user.email && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <a href={`mailto:${user.email}`} className="text-muted-foreground hover:text-primary transition-colors truncate min-w-0">
                      {user.email}
                    </a>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${user.phone}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {user.phone}
                    </a>
                  </div>
                )}
                {user.address && (
                  <div className="flex items-start gap-2 text-xs sm:text-sm">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground break-words min-w-0">{user.address}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                    onClick={() => handleEdit(user)}
                  >
                    <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Modifica</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    disabled={deleteUser.isPending}
                    className="px-2 sm:px-3 h-8 sm:h-9"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UserDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        user={selectedUser}
      />
    </div>
  )
}
