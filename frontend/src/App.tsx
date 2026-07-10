import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import RequireAuth from "@/components/RequireAuth";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ClientDashboard from "@/pages/ClientDashboard";
import TrainerDashboard from "@/pages/TrainerDashboard";

function Home() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "trainer" ? "/dashboard/trainer" : "/dashboard/client"} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard/client"
            element={
              <RequireAuth role="client">
                <ClientDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/trainer"
            element={
              <RequireAuth role="trainer">
                <TrainerDashboard />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
