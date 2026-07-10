import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function ClientDashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 480, margin: "4rem auto" }}>
      <h1>Client Dashboard</h1>
      <p>Welcome, {user?.name}.</p>
      <Button onClick={logout}>Log out</Button>
    </div>
  );
}
