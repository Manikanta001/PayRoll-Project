import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Register() {
  const { registerWithEmailPassword, isAuthenticating } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [rolePassword, setRolePassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!fullName || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    // Validate role password for HR/Admin
    if (role === "hr" && rolePassword !== "hr@9878") {
      setError("Invalid HR password. Correct password is required to register as HR.");
      return;
    }
    if (role === "admin" && rolePassword !== "admin@9878") {
      setError("Invalid Admin password. Correct password is required to register as Admin.");
      return;
    }
    
    try {
      console.log("Attempting registration with:", { fullName, email, role });
      const user = await registerWithEmailPassword(fullName, email, password, role);
      console.log("Registration successful!");
      if (user) {
        navigate("/Dashboard");
      }
    } catch (err) {
      console.error("Registration error details:", err);
      console.error("Error response data:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      if (err.response?.status === 409) {
        setError("An account with this email already exists.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Something went wrong while registering. Check console (F12) for details.");
      }
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create a PayRoll Pro account</CardTitle>
          <CardDescription className="text-center">
            Register with your work email to manage payroll and attendance.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                placeholder="Ajay Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(role === "hr" || role === "admin") && (
              <div className="space-y-2">
                <Label htmlFor="rolePassword">
                  {role === "hr" ? "HR" : "Admin"} Registration Password</Label>
                <Input
                  id="rolePassword"
                  type="password"
                  placeholder="Enter secure password"
                  value={rolePassword}
                  onChange={(e) => setRolePassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A secure password is required to register as {role === "hr" ? "HR" : "Admin"}.
                </p>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isAuthenticating}>
              {isAuthenticating ? "Creating account..." : "Create account"}
            </Button>
            <button
              type="button"
              onClick={() => navigate("/SignIn")}
              className="text-xs text-center text-blue-600 hover:underline"
            >
              Already have an account? Sign in
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

