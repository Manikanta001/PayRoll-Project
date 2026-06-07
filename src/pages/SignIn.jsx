import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

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

  const handleQuickLogin = async (testEmail) => {
    setError("");
    setEmail(testEmail);
    setPassword("password123");
    try {
      const user = await signInWithEmailPassword(testEmail, "password123");
      if (user) {
        if (user.role === "admin" || user.role === "hr") {
          const fifteenMinutes = 15 * 60 * 1000;
          sessionStorage.setItem("payroll_elevated_verified_until", String(Date.now() + fifteenMinutes));
        }
        navigate("/Dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to login with test user");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: "2s"}}></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: "4s"}}></div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center space-y-4 pb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-block"
            >
              <CardTitle className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                PayRoll Pro
              </CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <CardDescription className="text-lg text-slate-600">
                Manage Your Payroll with Ease
              </CardDescription>
            </motion.div>
          </CardHeader>
        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <CardContent className="space-y-5">
              <motion.div
                className="space-y-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Label htmlFor="email" className="text-slate-700 font-medium">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </motion.div>
              <motion.div
                className="space-y-2"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </motion.div>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-600 bg-red-50 p-2 rounded"
                >
                  {error}
                </motion.p>
              )}
            </CardContent>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <CardFooter className="flex flex-col gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold py-2 rounded-lg shadow-lg"
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? "Signing in..." : "Sign In"}
                </Button>
              </motion.div>
              <motion.button
                type="button"
                onClick={() => navigate("/Register")}
                className="text-sm text-center text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                Don&apos;t have an account? Register
              </motion.button>

              <div className="relative flex items-center justify-center my-2 w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <span className="relative px-3 bg-white text-xs text-slate-400 uppercase font-semibold">
                  Or Test the App
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin("admin@company.com")}
                  className="text-xs font-semibold py-1 hover:bg-blue-50 border-slate-200"
                  disabled={isAuthenticating}
                >
                  Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin("hr@company.com")}
                  className="text-xs font-semibold py-1 hover:bg-blue-50 border-slate-200"
                  disabled={isAuthenticating}
                >
                  HR
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin("employee@company.com")}
                  className="text-xs font-semibold py-1 hover:bg-blue-50 border-slate-200"
                  disabled={isAuthenticating}
                >
                  Employee
                </Button>
              </div>
            </CardFooter>
          </motion.div>
        </form>
      </Card>
    </motion.div>
    </div>
  );
}
