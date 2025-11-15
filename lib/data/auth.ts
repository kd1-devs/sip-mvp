import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "../supabase/server";

export type AuthLevel = "public" | "authenticated" | "admin";

export interface AuthContext {
  userId: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: any;
}

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    userId: user?.id || null,
    isAuthenticated: !!user,
    isAdmin: user?.user_metadata?.role === "admin" || false,
    user: user || null,
  };
});

export async function checkAuth(requiredLevel: AuthLevel): Promise<void> {
  const context = await getAuthContext();

  if (requiredLevel === "authenticated" && !context.isAuthenticated) {
    redirect("/login");
  }

  if (requiredLevel === "admin" && !context.isAdmin) {
    throw new Error("Admin access required");
  }
}
