import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VERIFIED_UNTIL_KEY = "payroll_elevated_verified_until";

function isVerifiedNow() {
  const raw = sessionStorage.getItem(VERIFIED_UNTIL_KEY);
  const until = raw ? Number(raw) : 0;
  return Number.isFinite(until) && until > Date.now();
}

export default function RequireElevated({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const needsElevated = useMemo(() => {
    const role = user?.role;
    return role === "admin" || role === "hr";
  }, [user]);

  if (!needsElevated) return children;
  if (typeof window !== "undefined" && isVerifiedNow()) return children;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Please enter your password to continue.");
      return;
    }
    setIsVerifying(true);
    try {
      const ok = await base44.auth.verifyPassword(password);
      if (!ok) {
        setError("Incorrect password.");
        return;
      }
      const fifteenMinutes = 15 * 60 * 1000;
      sessionStorage.setItem(VERIFIED_UNTIL_KEY, String(Date.now() + fifteenMinutes));
      setPassword("");
    } catch (err) {
      setError("Unable to verify password right now.");
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirm access</CardTitle>
          <CardDescription>
            Your account has elevated privileges ({user?.role}). Please re-enter your password to access the app.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleVerify}>
          <CardContent className="space-y-4">
            <div className="text-xs text-muted-foreground">
              Attempted path: <span className="font-mono">{location.pathname}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="elevated_password">Password</Label>
              <Input
                id="elevated_password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isVerifying}>
              {isVerifying ? "Verifying..." : "Continue"}
            </Button>
            <Button type="button" variant="outline" onClick={logout}>
              Log out
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

