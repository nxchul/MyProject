"use client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import supabaseBrowser from "@/lib/supabase-browser";

export default function LoginPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-20">
      <h1 className="mb-6 text-2xl font-semibold">Sign in to YNS Portal</h1>
      <Auth
        supabaseClient={supabaseBrowser}
        appearance={{ theme: ThemeSupa }}
        providers={["google"]}
        socialLayout="horizontal"
      />
    </main>
  );
}