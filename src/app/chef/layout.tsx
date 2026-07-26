import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import type { ReactNode } from "react";

export default async function ChefLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  // Only chefs can access /chef/*
  if (!user || user.role !== "chef") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-cream">
      {children}
    </div>
  );
}
