import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "trainer">("client");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.register({ name, email, password, role });
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div style={{ maxWidth: 320, margin: "4rem auto" }}>
      <h1>Register</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <label>
          <input type="radio" name="role" checked={role === "client"} onChange={() => setRole("client")} /> Client
        </label>
        <label>
          <input type="radio" name="role" checked={role === "trainer"} onChange={() => setRole("trainer")} /> Trainer
        </label>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <Button type="submit">Register</Button>
      </form>
      <p>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  );
}
