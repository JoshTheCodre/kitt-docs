"use client";

import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import InstallAppButton from "@/components/install-app-button";

const departments = [
  "Computer Science",
  "Engineering",
  "Medicine",
  "Law",
  "Business Administration",
  "Economics",
  "Psychology",
  "Biology",
  "Chemistry",
  "Physics",
  "Mathematics",
  "English",
  "Other",
];

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // For Google Profile Modal
  const [showGoogleProfile, setShowGoogleProfile] = useState(false);
  const [googleUserId, setGoogleUserId] = useState("");
  const [googleUserEmail, setGoogleUserEmail] = useState("");

  // 1. Normal email/password login/register logic (unchanged)
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "You've been logged in successfully.",
        });
      } else {
        if (!name || !school || !department || !level) {
          throw new Error("Please fill in all required fields");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name,
            },
          },
        });
        if (error) throw error;

        if (data.user) {
          if (!data.user.email_confirmed_at && data.user.confirmation_sent_at) {
            toast({
              title: "Check your email",
              description:
                "Please check your email and click the confirmation link to complete registration.",
            });
            return;
          }

          // Wait for user creation
          await new Promise((resolve) => setTimeout(resolve, 1000));

          try {
            const { data: existingUser } = await supabase
              .from("users")
              .select("id")
              .eq("id", data.user.id)
              .single();

            if (!existingUser) {
              const { error: profileError } = await supabase
                .from("users")
                .insert({
                  id: data.user.id,
                  email: data.user.email || email,
                  name: name,
                  school: school,
                  department: department,
                  level: level,
                  role: "buyer",
                });

              if (profileError) {
                throw new Error(
                  `Failed to create user profile: ${profileError.message}`,
                );
              }

              // Create wallet for the user
              const { error: walletError } = await supabase
                .from("wallets")
                .insert({
                  user_id: data.user.id,
                  balance: 0.00,
                });

              if (walletError) {
                console.error("Wallet creation error:", walletError);
                // Don't throw error here as profile was created successfully
              }
            }

            toast({
              title: "Account created!",
              description: "Welcome to Qitt! You can now start exploring.",
            });
          } catch (dbError) {
            toast({
              title: "Account created",
              description:
                "Your account was created but some setup may be incomplete. Please try logging in.",
              variant: "default",
            });
          }
        }
      }
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Google Auth logic (with modal on registration)
  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      // User will be redirected, so pause here
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // 3. Check Google session after redirect, and show modal if user is new
  useEffect(() => {
    const checkGoogleUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return; // Not logged in

      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      // If not found in users table, and we're not already in profile modal
      if (!existingUser && !showGoogleProfile) {
        setGoogleUserId(user.id);
        setGoogleUserEmail(user.email || "");
        setShowGoogleProfile(true);
      }
    };

    checkGoogleUser();
  }, [showGoogleProfile]);

  // 4. Handle Google Profile Creation (after modal submit)
  const handleGoogleProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!name || !school || !department || !level) {
        throw new Error("Please fill in all required fields");
      }

      const { error: profileError } = await supabase.from("users").insert({
        id: googleUserId,
        email: googleUserEmail,
        name,
        school,
        department,
        level,
        role: "buyer",
      });

      if (profileError) {
        throw new Error(
          `Failed to create user profile: ${profileError.message}`,
        );
      }

      // Create wallet for the Google user
      const { error: walletError } = await supabase
        .from("wallets")
        .insert({
          user_id: googleUserId,
          balance: 0.00,
        });

      if (walletError) {
        console.error("Wallet creation error:", walletError);
        // Don't throw error here as profile was created successfully
      }

      setShowGoogleProfile(false);
      toast({
        title: "Profile completed!",
        description: "Welcome to Qitt! You can now start exploring.",
      });
      // Optional: reload page or redirect
    } catch (err) {
      toast({
        title: "Profile creation failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? "Welcome back" : "Join Qitt"}
          </h1>
          <p className="text-gray-600">
            {isLogin
              ? "Sign in to your account"
              : "Create your student account"}
          </p>
        </div>

        {/* Install App Button */}
        <InstallAppButton className="mb-6" />

        {/* Auth Form */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardContent className="p-6">
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12 border-gray-200 rounded-xl"
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-gray-200 rounded-xl"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-gray-200 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {!isLogin && (
                <>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="University/School"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className="pl-10 h-12 border-gray-200 rounded-xl"
                      required={!isLogin}
                    />
                  </div>

                  <Select
                    value={department}
                    onValueChange={setDepartment}
                    required={!isLogin}
                  >
                    <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={level}
                    onValueChange={setLevel}
                    required={!isLogin}
                  >
                    <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 Level</SelectItem>
                      <SelectItem value="200">200 Level</SelectItem>
                      <SelectItem value="300">300 Level</SelectItem>
                      <SelectItem value="400">400 Level</SelectItem>
                      <SelectItem value="500">500 Level</SelectItem>
                      <SelectItem value="postgraduate">Postgraduate</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg"
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Sign In"
                    : "Create Account"}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google OAuth Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full h-12 text-lg font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 bg-white text-gray-700 shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </form>

            {isLogin && (
              <div className="text-center mt-4">
                <button className="text-blue-600 text-sm hover:underline">
                  Forgot your password?
                </button>
              </div>
            )}

            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </p>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 font-semibold hover:underline mt-1"
              >
                {isLogin ? "Sign up for free" : "Sign in instead"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Google Profile Modal (appears only if Google login with missing profile) */}
      {showGoogleProfile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            onSubmit={handleGoogleProfile}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 space-y-4"
          >
            <h2 className="text-2xl font-bold mb-2 text-center">
              Complete Your Profile
            </h2>
            <p className="text-gray-600 text-center mb-4">
              We need a few more details to finish your registration.
            </p>
            <Input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="University/School"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              required
            />
            <Select value={department} onValueChange={setDepartment} required>
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={setLevel} required>
              <SelectTrigger>
                <SelectValue placeholder="Select Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100 Level</SelectItem>
                <SelectItem value="200">200 Level</SelectItem>
                <SelectItem value="300">300 Level</SelectItem>
                <SelectItem value="400">400 Level</SelectItem>
                <SelectItem value="500">500 Level</SelectItem>
                <SelectItem value="postgraduate">Postgraduate</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl"
              disabled={loading}
            >
              {loading ? "Completing..." : "Finish Registration"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
