// Settings page — shared by trainer and client shells.
// Simple by design: change password + log out.

import { useState, type FormEvent } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/authApi";
import { useAuth } from "@/context/AuthContext";
import displayError from "@/lib/displayError";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      displayError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      displayError("New password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      toast.success("Password updated", { position: "top-center" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      displayError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {user?.email}
        </p>
      </div>

      {/* Change password */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-lime-300" />
            Change password
          </CardTitle>
          <CardDescription>
            Enter your current password, then choose a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="bg-lime-400 text-black hover:bg-lime-300"
            >
              {saving ? "Updating..." : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Log out */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="size-4 text-rose-300" />
            Log out
          </CardTitle>
          <CardDescription>
            End your session on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={logout}>
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
