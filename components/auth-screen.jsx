"use client";
import React, { useState } from "react";
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

const schools = [
  "University of Port Harcourt (UNIPORT)",
  "Rivers State University",
  "University of Calabar (UNICAL)",
];
const departments = [
  "Computer Science",
  "Electrical Engineering",
  "Medicine",
  "Pharmacy",
  "Law",
  "Nursing",
  "Accounting",
  "Economics",
  "Sociology",
  "Physics",
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

const FieldSelect = ({ label, value, setValue, options }) => (
  <div>
    <label className="text-sm font-medium">{label} *</label>
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger className="h-12 border-gray-200 rounded-xl bg-white">
        <SelectValue placeholder={`Select your ${label.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
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
  const [screen, setScreen] = useState("login"); // login or signup
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    school: "",
    department: "",
    level: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  function handleInput(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSignUp(e) {
    e.preventDefault();
    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.school ||
      !form.department ||
      !form.level
    )
      return toast({ title: "All fields required" });
    setLoading(true);

    // 1. Create Supabase user
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (error) {
      toast({ title: "Error", description: error.message });
      setLoading(false);
      return;
    }

    // 2. Insert user profile (if signUp successful)
    const userId = data?.user?.id;
    if (!userId) {
      toast({ title: "Error", description: "User creation failed" });
      setLoading(false);
      return;
    }
    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      name: form.name,
      email: form.email,
      school: form.school,
      department: form.department,
      level: form.level,
      role: "buyer",
    });
    if (userError) {
      toast({ title: "User DB error", description: userError.message });
      setLoading(false);
      return;
    }

    // 3. Insert wallet (if user insert successful)
    const { error: walletError } = await supabase
      .from("wallets")
      .insert({ user_id: userId, balance: 0.0 });
    if (walletError) {
      toast({ title: "Wallet DB error", description: walletError.message });
      setLoading(false);
      return;
    }

    toast({ title: "Sign up successful" });
    setLoading(false);
    window.location.href = "/home";
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) toast({ title: "Login failed", description: error.message });
    else window.location.href = "/home";
    setLoading(false);
  }

  // Signup form
  if (screen === "signup")
    return (
      <CenterBox>
        <Header icon={<BookOpen />} title="Sign Up" />
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <input
                name="name"
                value={form.name}
                onChange={handleInput}
                type="name"
                required
                placeholder="name"
                className="w-full h-12 px-4 rounded-xl border"
              />
              <input
                name="email"
                value={form.email}
                onChange={handleInput}
                type="email"
                required
                placeholder="Email"
                className="w-full h-12 px-4 rounded-xl border"
              />
              <input
                name="password"
                value={form.password}
                onChange={handleInput}
                type="password"
                required
                placeholder="Password"
                className="w-full h-12 px-4 rounded-xl border"
              />
              <FieldSelect
                label="University/School"
                value={form.school}
                setValue={(v) => setForm((f) => ({ ...f, school: v }))}
                options={schools}
              />
              <FieldSelect
                label="Department"
                value={form.department}
                setValue={(v) => setForm((f) => ({ ...f, department: v }))}
                options={departments}
              />
              <FieldSelect
                label="Level"
                value={form.level}
                setValue={(v) => setForm((f) => ({ ...f, level: v }))}
                options={levels}
              />
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl"
                disabled={loading}
              >
                {loading ? "Signing up..." : "Sign Up"}
              </Button>
            </form>
            <div className="text-center mt-4">
              <button
                onClick={() => setScreen("login")}
                className="text-sm text-gray-600 hover:underline flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </CenterBox>
    );

  // Login form
  return (
    <CenterBox>
      <Header icon={<BookOpen />} title="Login" />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              name="email"
              value={form.email}
              onChange={handleInput}
              type="email"
              required
              placeholder="Email"
              className="w-full h-12 px-4 rounded-xl border"
            />
            <input
              name="password"
              value={form.password}
              onChange={handleInput}
              type="password"
              required
              placeholder="Password"
              className="w-full h-12 px-4 rounded-xl border"
            />
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <div className="text-center mt-4">
            <span className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button onClick={() => setScreen("signup")} className="underline">
                Sign Up
              </button>
            </span>
          </div>
        </CardContent>
      </Card>
    </CenterBox>
  );
}

const CenterBox = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <div className="w-full max-w-md">{children}</div>
  </div>
);

const Header = ({ icon, title }) => (
  <div className="text-center mb-8">
    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
      {icon}
    </div>
    <h1 className="text-3xl font-bold mb-2">{title}</h1>
  </div>
);
