import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Calendar, Monitor, Activity } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Benvenuto nel sistema di gestione FarmaDisplay
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Farmacie</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Farmacie registrate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turni</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Turni programmati
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispositivi</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Dispositivi attivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistema</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              Stato del sistema
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inizia</CardTitle>
          <CardDescription>
            Esplora le funzionalità principali del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">1. Gestione Farmacie</h3>
            <p className="text-sm text-muted-foreground">
              Aggiungi e gestisci le tue farmacie, incluse informazioni di contatto e posizione geografica.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">2. Programmazione Turni</h3>
            <p className="text-sm text-muted-foreground">
              Crea turni singoli o ricorrenti per le tue farmacie utilizzando il calendario integrato.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">3. Gestione Dispositivi</h3>
            <p className="text-sm text-muted-foreground">
              Registra e attiva dispositivi Raspberry Pi per visualizzare i turni presso le farmacie.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
