
"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, ArrowLeft } from "lucide-react";
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
import InstallAppButton from "@/components/install-app-button";

const departments = [
  "Computer Science",
  "Software Engineering", 
  "Information Technology",
  "Cybersecurity",
  "Data Science",
  "Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Medicine",
  "Nursing",
  "Pharmacy",
  "Dentistry",
  "Law",
  "Business Administration",
  "Marketing",
  "Accounting",
  "Finance",
  "Economics",
  "Psychology",
  "Sociology",
  "Political Science",
  "Biology",
  "Chemistry",
  "Physics",
  "Mathematics",
  "Statistics",
  "English",
  "Literature",
  "History",
  "Philosophy",
  "Education",
  "Architecture",
  "Art & Design",
  "Music",
  "Theatre Arts",
  "Mass Communication",
  "Journalism",
  "Other",
];

const schools = [
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "Obafemi Awolowo University (OAU)",
  "University of Nigeria, Nsukka (UNN)",
  "Ahmadu Bello University (ABU)",
  "University of Benin (UNIBEN)",
  "Lagos State University (LASU)",
  "Covenant University",
  "Babcock University",
  "Redeemer's University",
  "Federal University of Technology, Akure (FUTA)",
  "Federal University of Technology, Owerri (FUTO)",
  "University of Port Harcourt (UNIPORT)",
  "Delta State University (DELSU)",
  "Rivers State University",
  "Cross River University of Technology (CRUTECH)",
  "University of Calabar (UNICAL)",
  "Bayero University Kano (BUK)",
  "University of Jos (UNIJOS)",
  "Federal University Lokoja",
  "University of Abuja",
  "Nnamdi Azikiwe University (UNIZIK)",
  "Imo State University (IMSU)",
  "Michael Okpara University of Agriculture",
  "Enugu State University of Science and Technology",
  "Federal University of Agriculture, Abeokuta",
  "Olabisi Onabanjo University",
  "Tai Solarin University of Education",
  "Other"
];

export default function AuthScreen() {
  const [screen, setScreen] = useState('landing'); // 'landing', 'signup', 'profile-completion'
  const [school, setSchool] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await handleUserAfterAuth(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleUserAfterAuth = async (user) => {
    try {
      // Check if user exists in our database
      const { data: existingUser, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking user:", error);
        return;
      }

      if (existingUser) {
        // User exists, redirect to dashboard
        window.location.href = "/home";
      } else {
        // New user, show profile completion form
        setPendingUser(user);
        setScreen('profile-completion');
      }
    } catch (error) {
      console.error("Error handling user after auth:", error);
      toast({
        title: "Authentication error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleAuth = async (isSignUp = false) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });
      
      if (error) throw error;
    } catch (error) {
      toast({
        title: isSignUp ? "Sign up failed" : "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();

    if (!school || !department || !level) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!pendingUser) {
      toast({
        title: "Session error",
        description: "Please sign in again",
        variant: "destructive",
      });
      setScreen('landing');
      return;
    }

    setLoading(true);

    try {
      // Get user info from Google metadata
      const name = pendingUser.user_metadata?.full_name || 
                   pendingUser.user_metadata?.name || 
                   pendingUser.email?.split("@")[0];
      const avatar_url = pendingUser.user_metadata?.avatar_url || 
                        pendingUser.user_metadata?.picture;

      // Create user profile
      const { error: profileError } = await supabase
        .from("users")
        .insert({
          id: pendingUser.id,
          email: pendingUser.email,
          name: name,
          image: avatar_url,
          school: school,
          department: department,
          level: level,
          role: "buyer",
        });

      if (profileError) throw profileError;

      // Create wallet
      const { error: walletError } = await supabase
        .from("wallets")
        .insert({
          user_id: pendingUser.id,
          balance: 0.0,
        });

      if (walletError) {
        console.error("Wallet creation error:", walletError);
      }

      toast({
        title: "Welcome to Qitt! 🎉",
        description: "Your account has been created successfully.",
      });

      // Redirect to dashboard
      window.location.href = "/home";

    } catch (error) {
      console.error("Profile completion error:", error);
      toast({
        title: "Profile completion failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Profile Completion Screen
  if (screen === 'profile-completion') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600">
              Tell us about your academic journey
            </p>
          </div>

          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6">
              <form onSubmit={handleCompleteProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    University/School *
                  </label>
                  <Select value={school} onValueChange={setSchool} required>
                    <SelectTrigger className="h-12 border-gray-200 rounded-xl bg-white hover:border-gray-300 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Select your school" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-60">
                      {schools.map((schoolOption) => (
                        <SelectItem 
                          key={schoolOption} 
                          value={schoolOption}
                          className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900"
                        >
                          {schoolOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Department *
                  </label>
                  <Select value={department} onValueChange={setDepartment} required>
                    <SelectTrigger className="h-12 border-gray-200 rounded-xl bg-white hover:border-gray-300 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-60">
                      {departments.map((dept) => (
                        <SelectItem 
                          key={dept} 
                          value={dept}
                          className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900"
                        >
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Level *
                  </label>
                  <Select value={level} onValueChange={setLevel} required>
                    <SelectTrigger className="h-12 border-gray-200 rounded-xl bg-white hover:border-gray-300 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                      <SelectItem value="100" className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900">100 Level</SelectItem>
                      <SelectItem value="200" className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900">200 Level</SelectItem>
                      <SelectItem value="300" className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900">300 Level</SelectItem>
                      <SelectItem value="400" className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900">400 Level</SelectItem>
                      <SelectItem value="500" className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900">500 Level</SelectItem>
                      <SelectItem value="postgraduate" className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900">Postgraduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
                >
                  {loading ? "Creating Account..." : "Complete Registration"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Sign Up Screen
  if (screen === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Join Qitt
            </h1>
            <p className="text-gray-600">
              Create your student resource account
            </p>
          </div>

          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6">
              <form className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    University/School *
                  </label>
                  <Select value={school} onValueChange={setSchool} required>
                    <SelectTrigger className="h-12 border-gray-200 rounded-xl bg-white hover:border-gray-300 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Select your school" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-60">
                      {schools.map((schoolOption) => (
                        <SelectItem 
                          key={schoolOption} 
                          value={schoolOption}
                          className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900"
                        >
                          {schoolOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Department *
                  </label>
                  <Select value={department} onValueChange={setDepartment} required>
                    <SelectTrigger className="h-12 border-gray-200 rounded-xl bg-white hover:border-gray-300 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-60">
                      {departments.map((dept) => (
                        <SelectItem 
                          key={dept} 
                          value={dept}
                          className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900"
                        >
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Level *
                  </label>
                  <Select value={level} onValueChange={setLevel} required>
                    <SelectTrigger className="h-12 border-gray-200 rounded-xl bg-white hover:border-gray-300 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                      <SelectItem value="100" className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900">100 Level</SelectItem>
                      <SelectItem value="200" className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900">200 Level</SelectItem>
                      <SelectItem value="300" className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900">300 Level</SelectItem>
                      <SelectItem value="400" className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900">400 Level</SelectItem>
                      <SelectItem value="500" className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900">500 Level</SelectItem>
                      <SelectItem value="postgraduate" className="hover:bg-blue-50 cursor-pointer px-3 py-2 text-gray-900">Postgraduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => handleGoogleAuth(true)}
                  disabled={loading || !school || !department || !level}
                  className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transition-all duration-200"
                >
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="white"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="white"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="white"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="white"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {loading ? "Setting up..." : "Sign up with Google"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setScreen('landing')}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-6 text-sm text-gray-500 leading-relaxed">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </div>
    );
  }

  // Landing Screen (Sign In / Sign Up choice)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome to Qitt
          </h1>
          <p className="text-lg text-gray-600">
            Your ultimate student resource platform
          </p>
        </div>

        {/* Install App Button */}
        <InstallAppButton className="mb-8" />

        {/* Auth Options */}
        <div className="space-y-4">
          {/* Sign In */}
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Already have an account?
                </h2>
                <p className="text-gray-600">
                  Sign in with your Google account
                </p>
              </div>

              <Button
                onClick={() => handleGoogleAuth(false)}
                disabled={loading}
                className="w-full h-14 text-lg font-semibold rounded-xl bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 shadow-sm transition-all duration-200"
              >
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
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
                {loading ? "Signing in..." : "Sign in with Google"}
              </Button>
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-500">
                or
              </span>
            </div>
          </div>

          {/* Sign Up */}
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  New to Qitt?
                </h2>
                <p className="text-gray-600">
                  Create your account and start exploring
                </p>
              </div>

              <Button
                onClick={() => setScreen('signup')}
                className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transition-all duration-200"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
