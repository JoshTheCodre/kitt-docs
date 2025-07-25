
"use client";
import React, { useState, useEffect } from "react";
import { BookOpen, ArrowLeft, User, Mail, Lock, Building, GraduationCap, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const schools = [
  "University of Port Harcourt (UNIPORT)",
  "Rivers State University",
  "University of Calabar (UNICAL)",
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "Ahmadu Bello University (ABU)",
  "University of Nigeria, Nsukka (UNN)",
  "Obafemi Awolowo University (OAU)",
];

const departments = [
  "Computer Science",
  "Electrical Engineering", 
  "Mechanical Engineering",
  "Civil Engineering",
  "Medicine",
  "Pharmacy",
  "Law",
  "Nursing",
  "Accounting",
  "Economics",
  "Business Administration",
  "Mass Communication",
  "Political Science",
  "Sociology",
  "Psychology",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "English",
];

const levels = [
  "100 Level",
  "200 Level", 
  "300 Level",
  "400 Level",
  "500 Level",
  "600 Level",
  "Postgraduate",
];

const InputField = ({ icon: Icon, type, name, value, onChange, placeholder, required = false }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Icon className="h-5 w-5 text-gray-400" />
    </div>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
    />
  </div>
);

const FieldSelect = ({ icon: Icon, label, value, setValue, options, placeholder }) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
      <Icon className="h-5 w-5 text-gray-400" />
    </div>
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger className="h-12 pl-10 pr-4 border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default function AuthScreen() {
  const [screen, setScreen] = useState("signin");
  const [form, setForm] = useState({
    school: "",
    department: "",
    level: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check for existing session
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Check if user exists in database
      const { data: userProfile } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (userProfile) {
        // User exists, redirect to home
        window.location.href = "/home";
      } else {
        // User doesn't exist, show registration form
        setScreen("signup");
      }
    }
  };

  function handleInput(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpWithGoogle = async () => {
    if (!form.school || !form.department || !form.level) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields before continuing.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?school=${encodeURIComponent(form.school)}&department=${encodeURIComponent(form.department)}&level=${encodeURIComponent(form.level)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if this is a new user that needs profile completion
        const { data: userProfile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!userProfile && screen === "signup") {
          // Create user profile with Google data + form data
          const userData = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "User",
            image: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
            school: form.school,
            department: form.department,
            level: form.level,
            role: "buyer"
          };

          const { error: userError } = await supabase
            .from("users")
            .insert(userData);

          if (userError) {
            console.error("Error creating user profile:", userError);
            toast({
              title: "Profile creation failed",
              description: userError.message,
              variant: "destructive"
            });
            return;
          }

          toast({
            title: "Welcome to Qitt! 🎉",
            description: "Your account has been created successfully.",
          });
        }

        if (userProfile || screen === "signup") {
          window.location.href = "/home";
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, screen]);

  // Sign Up Screen
  if (screen === "signup") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Qitt</h1>
            <p className="text-gray-600">Complete your profile to get started</p>
          </div>

          <Card className="backdrop-blur-xl bg-white/80 border-0 shadow-2xl rounded-3xl">
            <CardContent className="p-8">
              <div className="space-y-6">
                <FieldSelect
                  icon={Building}
                  label="University/School"
                  value={form.school}
                  setValue={(v) => setForm((f) => ({ ...f, school: v }))}
                  options={schools}
                  placeholder="Select your university"
                />
                
                <FieldSelect
                  icon={GraduationCap}
                  label="Department"
                  value={form.department}
                  setValue={(v) => setForm((f) => ({ ...f, department: v }))}
                  options={departments}
                  placeholder="Select your department"
                />
                
                <FieldSelect
                  icon={Users}
                  label="Level"
                  value={form.level}
                  setValue={(v) => setForm((f) => ({ ...f, level: v }))}
                  options={levels}
                  placeholder="Select your level"
                />

                <Button
                  onClick={handleSignUpWithGoogle}
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? "Setting up your account..." : "Continue with Google"}
                </Button>
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={() => setScreen("signin")}
                  className="text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2 mx-auto text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Already have an account? Sign in
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Sign In Screen
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Sign in to continue your learning journey</p>
        </div>

        <Card className="backdrop-blur-xl bg-white/80 border-0 shadow-2xl rounded-3xl">
          <CardContent className="p-8">
            <div className="space-y-6">
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-14 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-gray-300 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? "Signing you in..." : "Continue with Google"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">New to Qitt?</span>
                </div>
              </div>

              <button
                onClick={() => setScreen("signup")}
                className="w-full text-blue-600 hover:text-blue-700 font-semibold text-lg transition-colors"
              >
                Create an account
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
