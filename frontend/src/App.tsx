import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

import TrainerLayout from "@/components/trainer/TrainerLayout";
import TrainerDashboard from "@/pages/trainer/TrainerDashboard";
import TrainerClients from "@/pages/trainer/TrainerClients";
import TrainerClientDetail from "@/pages/trainer/TrainerClientDetail";
import TrainerSchedule from "@/pages/trainer/TrainerSchedule";
import ClientLayout from "@/components/client/ClientLayout";
import ClientDashboard from "@/pages/client/ClientDashboard";
import ClientProgress from "@/pages/client/ClientProgress";

import { NotFound } from "@/pages/placeholders";
import ClientExerciseTemplates from "./pages/client/ClientExerciseTemplates";
import ClientSessions from "./pages/client/ClientSessions";
import SessionPage from "./pages/client/SessionPage";
import BrowseTrainers from "@/pages/client/BrowseTrainers";
import BrowseClients from "@/pages/trainer/BrowseClients";
import ListingDetail from "@/pages/marketplace/ListingDetail";
import MyListing from "@/pages/marketplace/MyListing";
import Notifications from "@/pages/marketplace/Notifications";
import RequestDetail from "@/pages/marketplace/RequestDetail";

// Route ownership:
//   /trainer/*                          → Jiachen Sun (trainer-client management) — implemented
//   /login, /register                   → Alex (auth) — implemented
//   /forgot-password, /reset-password   → Alex (auth) — implemented
//   /client/*                           → progress dashboard team — implemented
//   /*/browse, /*/my-listing,
//   /*/notifications, /*/requests/*     - Alex (marketplace) - implemented

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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

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
            <Route path="clients/:clientId" element={<TrainerClientDetail />} />
            <Route path="browse" element={<BrowseClients />} />
            <Route path="browse/:listingId" element={<ListingDetail />} />
            <Route path="my-listing" element={<MyListing />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="requests/:requestId" element={<RequestDetail />} />
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
            <Route path="workout-sessions" element={<ClientSessions />} />
            <Route
              path="workout-sessions/:sessionId"
              element={<SessionPage />}
            />
            <Route path="browse" element={<BrowseTrainers />} />
            <Route path="browse/:listingId" element={<ListingDetail />} />
            <Route path="my-listing" element={<MyListing />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="requests/:requestId" element={<RequestDetail />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
