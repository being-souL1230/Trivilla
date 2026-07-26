"use client";
import { useState } from "react";
import { Button, Field, Icon, Input, Modal } from "@/components/ui";
import { post, useAuth, useCart, useToast } from "@/store";

type Mode = "login" | "signup" | "otp";

export default function AuthModal() {
  const { authOpen, setAuthOpen } = useCart();
  const { refresh } = useAuth();
  const { push } = useToast();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", code: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const close = () => {
    setAuthOpen(false);
    setMode("login");
    setErrors({});
    setDemoOtp("");
    setForm({ name: "", email: "", phone: "", password: "", code: "" });
  };

  const finish = async (msg: string) => {
    await refresh();
    push(msg);
    close();
  };

  const doLogin = async () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = "Email is required";
    if (!form.password) e.password = "Password is required";
    if (Object.keys(e).length) return setErrors(e);
    setBusy(true);
    try {
      await post("/api/auth/login", { email: form.email, password: form.password });
      await finish("Namaste! You're signed in 🙏");
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Could not sign in" });
    } finally {
      setBusy(false);
    }
  };

  const doSignup = async () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Please enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.password.length < 6) e.password = "At least 6 characters";
    if (Object.keys(e).length) return setErrors(e);
    setBusy(true);
    try {
      const r = await post<{ demoOtp: string }>("/api/auth/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      setDemoOtp(r.demoOtp);
      setMode("otp");
      push("OTP bheja gaya! Check the demo inbox below", "info");
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Could not sign up" });
    } finally {
      setBusy(false);
    }
  };

  const doVerify = async () => {
    if (form.code.trim().length !== 6) return setErrors({ code: "Enter the 6-digit code" });
    setBusy(true);
    try {
      await post("/api/auth/verify", { email: form.email, code: form.code });
      await finish(`Welcome to the Rasoi family, ${form.name.split(" ")[0]}! 🎉`);
    } catch (err) {
      setErrors({ code: err instanceof Error ? err.message : "Wrong code" });
    } finally {
      setBusy(false);
    }
  };

  const doGoogle = async () => {
    setBusy(true);
    try {
      await post("/api/auth/google", {});
      await finish("Signed in with Google ✅");
    } catch {
      setErrors({ form: "Google sign-in failed — try again" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={authOpen} onClose={close} title={mode === "otp" ? "Verify it's you" : mode === "signup" ? "Create your account" : "Sign in to Rasoi"}>
      {mode !== "otp" && (
        <div className="mb-4 flex rounded-xl border border-line bg-white/60 p-1">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setErrors({});
              }}
              className={`flex-1 rounded-lg py-2 text-[13px] font-bold transition ${
                mode === m ? "bg-ink text-cream shadow-sm" : "text-ink2 hover:text-ink"
              }`}
            >
              {m === "login" ? "Sign in" : "New here? Sign up"}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3.5">
        {mode === "signup" && (
          <>
            <Field label="Full name" error={errors.name}>
              <Input placeholder="e.g. Kavya Patil" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Phone (optional)">
              <Input placeholder="98xxx xxxxx" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
          </>
        )}
        <Field label="Email" error={errors.email}>
          <Input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        {mode !== "otp" && (
          <Field label="Password" error={errors.password} hint={mode === "signup" ? "Minimum 6 characters" : undefined}>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (mode === "login" ? doLogin() : doSignup())}
            />
          </Field>
        )}
        {mode === "otp" && (
          <>
            <div className="rounded-xl border border-[#e6d3a3] bg-gold-soft px-4 py-3">
              <p className="text-[11.5px] font-bold uppercase tracking-wide text-[#7a5a12]">Demo inbox 📬</p>
              <p className="mt-0.5 text-[12.5px] font-medium text-[#7a5a12]">
                In real life this OTP comes by SMS / email. For this demo:
              </p>
              <p className="mt-1.5 font-mono text-xl font-bold tracking-[0.35em] text-ink">{demoOtp}</p>
            </div>
            <Field label="6-digit code sent to your email" error={errors.code}>
              <Input
                placeholder="______"
                maxLength={6}
                inputMode="numeric"
                className="text-center font-mono text-lg tracking-[0.4em]"
                value={form.code}
                onChange={(e) => set("code", e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && doVerify()}
              />
            </Field>
          </>
        )}

        {errors.form && (
          <p className="rounded-xl border border-[#ecc4ba] bg-chili-soft px-3.5 py-2.5 text-[12.5px] font-bold text-chili">{errors.form}</p>
        )}

        {mode === "login" && (
          <Button full size="lg" loading={busy} onClick={doLogin}>
            Sign in
          </Button>
        )}
        {mode === "signup" && (
          <Button full size="lg" loading={busy} onClick={doSignup} icon="arrow">
            Send OTP to my email
          </Button>
        )}
        {mode === "otp" && (
          <>
            <Button full size="lg" loading={busy} onClick={doVerify} icon="check">
              Verify & create account
            </Button>
            <button
              className="w-full text-center text-[12.5px] font-bold text-brand hover:underline"
              onClick={() => setMode("signup")}
            >
              Wrong email? Go back
            </button>
          </>
        )}

        {mode !== "otp" && (
          <>
            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink2">or</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <Button full size="lg" variant="outline" loading={busy} onClick={doGoogle} className="border-line bg-white font-bold">
              <Icon name="google" size={17} className="text-[#4285F4]" />
              Continue with Google
            </Button>
            <p className="text-center text-[11.5px] font-medium text-ink2">
              Demo mode — signs you in as a Google demo account.
            </p>
          </>
        )}
      </div>

      {mode === "login" && (
        <div className="mt-5 rounded-xl border border-line bg-sand/70 px-4 py-3">
          <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink2">Demo accounts to try</p>
          <div className="mt-1.5 grid grid-cols-2 gap-2 text-[12px] font-semibold text-ink">
            <div className="rounded-lg bg-white/80 px-2.5 py-2">
              <span className="block text-[10.5px] font-bold uppercase text-brand">Manager</span>
              manager@rasoi.in
              <span className="block text-ink2">rasoi123</span>
            </div>
            <div className="rounded-lg bg-white/80 px-2.5 py-2">
              <span className="block text-[10.5px] font-bold uppercase text-leaf">Customer</span>
              priya@example.com
              <span className="block text-ink2">priya123</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
