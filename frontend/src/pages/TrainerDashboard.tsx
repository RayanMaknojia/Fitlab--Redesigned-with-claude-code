import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function TrainerDashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 480, margin: "4rem auto" }}>
      <h1>Trainer Dashboard</h1>
      <p>Welcome, {user?.name}.</p>
      <Button onClick={logout}>Log out</Button>
    </div>
  );
}
