import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function SignIn() {
  const { signInWithEmailPassword, isAuthenticating } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    try {
      const user = await signInWithEmailPassword(email, password);
      if (user) {
        navigate("/Dashboard");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid credentials");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Invalid credentials");
      }
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Sign in to PayrollPro</CardTitle>
          <CardDescription className="text-center">
            Enter your work email and password to continue.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isAuthenticating}>
              {isAuthenticating ? "Signing in..." : "Sign in"}
            </Button>
            <button
              type="button"
              onClick={() => navigate("/Register")}
              className="text-xs text-center text-blue-600 hover:underline"
            >
              Don&apos;t have an account? Register
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

