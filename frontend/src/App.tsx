import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

// Pages
import LoginPage from '@/pages/LoginPage'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PharmaciesPage from '@/pages/PharmaciesPage'
import UsersPage from '@/pages/UsersPage'
import ProfilePage from '@/pages/ProfilePage'
import ConfigurationPage from '@/pages/ConfigurationPage'
// import ShiftsPage from '@/pages/ShiftsPage' // Temporaneamente nascosto
// import DevicesPage from '@/pages/DevicesPage' // Rimosso
import DashboardPage from '@/pages/DashboardPage'
import { BachecaPage } from '@/pages/BachecaPage'
import { PublicDisplayPage } from '@/pages/PublicDisplayPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, fetchCurrentUser } = useAuth()

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      fetchCurrentUser()
    }
  }, [isAuthenticated, isLoading, fetchCurrentUser])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Public route for display - no authentication required */}
          <Route path="/display/:displayId" element={<PublicDisplayPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="pharmacies" element={<PharmaciesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="configuration" element={<ConfigurationPage />} />
            {/* <Route path="shifts" element={<ShiftsPage />} /> */} {/* Temporaneamente nascosto */}
            {/* <Route path="devices" element={<DevicesPage />} /> */} {/* Rimosso */}
            <Route path="bacheca" element={<BachecaPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
