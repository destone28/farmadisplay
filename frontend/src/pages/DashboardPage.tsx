import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Calendar, Monitor, Activity } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Benvenuto nel sistema di gestione TurnoTec
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Farmacie</CardTitle>
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">--</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Farmacie registrate
            </p>
          </CardContent>
        </Card>

        {/* Temporaneamente nascosto
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Turni</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">--</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Turni programmati
            </p>
          </CardContent>
        </Card>
        */}

        {/* Rimosso - Card Dispositivi */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Sistema</CardTitle>
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">Online</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Stato del sistema
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Inizia</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Esplora le funzionalità principali del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="space-y-1 sm:space-y-2">
            <h3 className="text-sm sm:text-base font-semibold">1. Gestione Farmacie</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Aggiungi e gestisci le tue farmacie, incluse informazioni di contatto e posizione geografica.
            </p>
          </div>
          {/* Temporaneamente nascosto
          <div className="space-y-1 sm:space-y-2">
            <h3 className="text-sm sm:text-base font-semibold">2. Programmazione Turni</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Crea turni singoli o ricorrenti per le tue farmacie utilizzando il calendario integrato.
            </p>
          </div>
          */}
          {/* Rimosso - Sezione Gestione Dispositivi */}
        </CardContent>
      </Card>
    </div>
  )
}
