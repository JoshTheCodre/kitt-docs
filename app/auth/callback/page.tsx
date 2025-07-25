
"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";

export default function AuthCallback() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth error:", error);
          window.location.href = "/";
          return;
        }

        if (data.session?.user) {
          const user = data.session.user;
          
          // Check if user already exists
          const { data: existingUser } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single();

          if (!existingUser) {
            // Get form data from URL params
            const school = searchParams.get("school");
            const department = searchParams.get("department");
            const level = searchParams.get("level");

            if (school && department && level) {
              // Create new user profile
              const userData = {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.user_metadata?.name || "User",
                image: user.user_metadata?.avatar_url || user.user_metadata?.picture,
                school: decodeURIComponent(school),
                department: decodeURIComponent(department),
                level: decodeURIComponent(level),
                role: "buyer"
              };

              const { error: insertError } = await supabase
                .from("users")
                .insert(userData);

              if (insertError) {
                console.error("Error creating user:", insertError);
                window.location.href = "/?error=profile_creation_failed";
                return;
              }
            }
          }

          // Redirect to home
          window.location.href = "/home";
        } else {
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Callback error:", error);
        window.location.href = "/";
      }
    };

    handleAuthCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up your account...</p>
      </div>
    </div>
  );
}
