import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import TrainerLayout from "@/components/trainer/TrainerLayout"
import TrainerDashboard from "@/pages/trainer/TrainerDashboard"
import TrainerClients from "@/pages/trainer/TrainerClients"
import TrainerSchedule from "@/pages/trainer/TrainerSchedule"
import ClientLayout from "@/components/client/ClientLayout"
import ClientDashboard from "@/pages/client/ClientDashboard"
import ClientProgress from "@/pages/client/ClientProgress"

import {
  ClientPagePlaceholder,
  LoginPlaceholder,
  NotFound,
} from "@/pages/placeholders"

// Route ownership:
//   /trainer/*     → Jiachen Sun (trainer-client management) — implemented
//   /login         → Alex (auth) — placeholder, swap in your page
//   /client/*      → [your name] (client progress dashboard) — implemented
//   /clients/:id   → client view team — placeholder, swap in your page
// Assumes the user is already logged in as a trainer; auth guard comes later.

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/trainer" replace />} />

        {/* Trainer side */}
        <Route path="/trainer" element={<TrainerLayout />}>
          <Route index element={<TrainerDashboard />} />
          <Route path="clients" element={<TrainerClients />} />
          <Route path="schedule" element={<TrainerSchedule />} />
        </Route>

        {/* Client side */}
        <Route path="/client" element={<ClientLayout />}>
          <Route index element={<ClientDashboard />} />
          <Route path="progress" element={<ClientProgress />} />
        </Route>

        {/* Teammates' pages — replace the placeholders */}
        <Route path="/login" element={<LoginPlaceholder />} />
        <Route path="/clients/:clientId" element={<ClientPagePlaceholder />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
