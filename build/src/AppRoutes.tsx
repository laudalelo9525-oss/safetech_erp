import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/useAuth'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import ControllerEntry from './pages/ControllerEntry'
import CsvImport from './pages/CsvImport'
import DeliveryNotePage from './pages/DeliveryNotePage'
import DeliveryPlanPage from './pages/DeliveryPlanPage'
import DeliveryReportPage from './pages/DeliveryReportPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

// New ERP Modules Pages
import PlanningPage from './pages/PlanningPage'
import ProductionPage from './pages/ProductionPage'
import StockyardPage from './pages/StockyardPage'
import LogisticsPlanningPage from './pages/LogisticsPlanningPage'
import MasterDataPage from './pages/MasterDataPage'
import MaintenancePage from './pages/MaintenancePage'
import QrScannerPage from './pages/QrScannerPage'

export default function AppRoutes(){
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen concrete-bg flex flex-col md:flex-row transition-colors duration-200">
          
          {/* Responsive Sidebar Menu */}
          <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

          {/* Main Layout Area */}
          <div className="flex-grow flex flex-col md:pl-64 min-w-0 min-h-screen">
            
            {/* Top mobile header bar (Visible only on mobile screen sizes) */}
            <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white dark:bg-[#0c0c0f] border-b border-slate-200 dark:border-red-500/10 z-30 no-print">
              <button
                onClick={() => setMobileOpen(true)}
                className="text-slate-600 dark:text-slate-300 focus:outline-none text-xl p-1 font-bold"
                aria-label="Open Navigation Sidebar"
              >
                ☰
              </button>
              <div className="flex items-center gap-2">
                <img src="/safetech_logo.png" alt="Safetech" className="w-6 h-6 object-contain" />
                <span className="font-black text-xs tracking-tight text-neutral-900 dark:text-white uppercase leading-none">SAFETECH</span>
              </div>
              <div className="w-6" /> {/* Spacer */}
            </header>

            {/* Sub-page router body */}
            <main className="flex-grow p-4 md:p-6 z-10 w-full max-w-7xl mx-auto box-border overflow-x-hidden">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["viewer","controller","admin"]}><Dashboard /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPanel /></ProtectedRoute>} />
                <Route path="/entry" element={<ProtectedRoute allowedRoles={["controller","admin"]}><ControllerEntry /></ProtectedRoute>} />
                <Route path="/dispatch" element={<ProtectedRoute allowedRoles={["controller","admin"]}><ControllerEntry defaultTab="dispatch" /></ProtectedRoute>} />
                <Route path="/fleet" element={<ProtectedRoute allowedRoles={["controller","admin"]}><ControllerEntry defaultTab="fleet" /></ProtectedRoute>} />
                <Route path="/import" element={<ProtectedRoute allowedRoles={["admin"]}><CsvImport /></ProtectedRoute>} />
                <Route path="/delivery-note" element={<ProtectedRoute allowedRoles={["controller","admin"]}><DeliveryNotePage /></ProtectedRoute>} />
                <Route path="/delivery-plan" element={<ProtectedRoute allowedRoles={["controller","admin"]}><DeliveryPlanPage /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute allowedRoles={["viewer","controller","admin"]}><DeliveryReportPage /></ProtectedRoute>} />
                
                {/* Unified ERP Module Routes */}
                <Route path="/planning" element={<ProtectedRoute allowedRoles={["viewer","controller","admin"]}><PlanningPage /></ProtectedRoute>} />
                <Route path="/production" element={<ProtectedRoute allowedRoles={["viewer","controller","admin"]}><ProductionPage /></ProtectedRoute>} />
                <Route path="/stockyard" element={<ProtectedRoute allowedRoles={["viewer","controller","admin"]}><StockyardPage /></ProtectedRoute>} />
                <Route path="/logistics/planning" element={<ProtectedRoute allowedRoles={["viewer","controller","admin"]}><LogisticsPlanningPage /></ProtectedRoute>} />
                <Route path="/master" element={<ProtectedRoute allowedRoles={["viewer","controller","admin"]}><MasterDataPage /></ProtectedRoute>} />
                <Route path="/maintenance" element={<ProtectedRoute allowedRoles={["viewer","controller","admin"]}><MaintenancePage /></ProtectedRoute>} />
                <Route path="/qr-scanner" element={<ProtectedRoute allowedRoles={["viewer","controller","admin"]}><QrScannerPage /></ProtectedRoute>} />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>

        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
