import { useState } from 'react'
import { Plus, Edit, Trash2, MapPin, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePharmacies, useDeletePharmacy } from '@/hooks/usePharmacies'
import PharmacyDialog from '@/components/pharmacies/PharmacyDialog'
import type { Pharmacy } from '@/types'

export default function PharmaciesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | undefined>()
  const { data, isLoading } = usePharmacies()
  const deletePharmacy = useDeletePharmacy()

  const handleCreate = () => {
    setSelectedPharmacy(undefined)
    setIsDialogOpen(true)
  }

  const handleEdit = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa farmacia?')) {
      try {
        await deletePharmacy.mutateAsync(id)
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Errore durante l\'eliminazione')
      }
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedPharmacy(undefined)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Farmacie</h1>
          <p className="text-muted-foreground">
            Gestisci le tue farmacie e le relative informazioni
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuova Farmacia
        </Button>
      </div>

      {data?.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessuna farmacia</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Inizia aggiungendo la tua prima farmacia
            </p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Farmacia
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((pharmacy) => (
            <Card key={pharmacy.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{pharmacy.name}</CardTitle>
                    <CardDescription>
                      {pharmacy.city || 'Nessuna città'}
                    </CardDescription>
                  </div>
                  <div
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      pharmacy.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {pharmacy.is_active ? 'Attiva' : 'Inattiva'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {pharmacy.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{pharmacy.address}</span>
                  </div>
                )}
                {pharmacy.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{pharmacy.phone}</span>
                  </div>
                )}
                {pharmacy.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{pharmacy.email}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(pharmacy)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifica
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(pharmacy.id)}
                    disabled={deletePharmacy.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PharmacyDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        pharmacy={selectedPharmacy}
      />
    </div>
  )
}
