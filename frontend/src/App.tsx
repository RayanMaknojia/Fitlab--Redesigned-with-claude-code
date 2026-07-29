import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";

import TrainerLayout from "@/components/trainer/TrainerLayout";
import TrainerDashboard from "@/pages/trainer/TrainerDashboard";
import TrainerClients from "@/pages/trainer/TrainerClients";
import TrainerSchedule from "@/pages/trainer/TrainerSchedule";
import ClientLayout from "@/components/client/ClientLayout";
import ClientDashboard from "@/pages/client/ClientDashboard";
import ClientProgress from "@/pages/client/ClientProgress";

import { ClientPagePlaceholder, NotFound } from "@/pages/placeholders";
import ClientExerciseTemplates from "./pages/client/ClientExerciseTemplates";

// Route ownership:
//   /trainer/*     → Jiachen Sun (trainer-client management) — implemented
//   /login         → Alex (auth) — implemented
//   /client/*      → progress dashboard team — implemented
//   /clients/:id   → client view team — placeholder, swap in your page

function Home() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Navigate to={user.role === "trainer" ? "/trainer" : "/client"} replace />
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Trainer side */}
          <Route
            path="/trainer"
            element={
              <RequireAuth role="trainer">
                <TrainerLayout />
              </RequireAuth>
            }
          >
            <Route index element={<TrainerDashboard />} />
            <Route path="clients" element={<TrainerClients />} />
            <Route path="schedule" element={<TrainerSchedule />} />
          </Route>

          {/* Client side */}
          <Route
            path="/client"
            element={
              <RequireAuth role="client">
                <ClientLayout />
              </RequireAuth>
            }
          >
            <Route index element={<ClientDashboard />} />
            <Route path="progress" element={<ClientProgress />} />
            <Route
              path="exercise-templates"
              element={<ClientExerciseTemplates />}
            />
          </Route>

          {/* Teammates' pages — replace the placeholder */}
          <Route
            path="/clients/:clientId"
            element={<ClientPagePlaceholder />}
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
