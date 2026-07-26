import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "manager") {
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-4">
        <div className="max-w-md rounded-2xl border border-line bg-white/70 p-8 text-center">
          <p className="text-4xl">🙏</p>
          <h1 className="mt-3 font-display text-2xl font-bold text-ink">Staff only, {user.name.split(" ")[0]}!</h1>
          <p className="mt-2 text-sm font-medium text-ink2">
            The manager dashboard is for restaurant staff. You're signed in as a
            customer — try the demo manager account instead (manager@rasoi.in / rasoi123).
          </p>
          <Link href="/" className="mt-6 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-deep">
            Back to Rasoi
          </Link>
        </div>
      </div>
    );
  }
  return <AdminShell userName={user.name}>{children}</AdminShell>;
}
