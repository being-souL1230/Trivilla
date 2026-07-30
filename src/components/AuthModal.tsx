"use client";
import { useState } from "react";

import { Button, Field, Icon, Input, Modal } from "@/components/ui";
import { post, useAuth, useCart, useToast } from "@/store";

type Mode = "login" | "signup" | "otp" | "phone" | "phone-otp";

export default function AuthModal() {

  const { authOpen, setAuthOpen } = useCart();
  const { refresh, user } = useAuth();
  const { push } = useToast();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", code: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const close = () => {
    setAuthOpen(false);
    setMode("login");
    setErrors({});
    setForm({ name: "", email: "", phone: "", password: "", code: "" });
  };

  const finish = async (msg: string) => {
    const u = await refresh();
    push(msg);
    close();
    window.location.href = u?.role === "chef" ? "/chef/orders" : "/";
  };

  const doLogin = async () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = "Email is required";
    if (!form.password) e.password = "Password is required";
    if (Object.keys(e).length) return setErrors(e);
    setBusy(true);
    try {
      await post("/api/auth/login", { email: form.email, password: form.password });
      await finish("Namaste! You're signed in");
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
      await post("/api/auth/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      setMode("otp");
      push("OTP sent! Check your email", "info");
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
      await finish(`Welcome to the Trivilla family, ${form.name.split(" ")[0]}!`);
    } catch (err) {
      setErrors({ code: err instanceof Error ? err.message : "Wrong code" });
    } finally {
      setBusy(false);
    }
  };

  const doGoogle = () => {
    window.location.href = "/api/auth/google/authorize";
  };

  /* ---- TextBee Phone OTP ---- */

  const doSendPhoneOtp = async () => {
    const phone = form.phone.replace(/\D/g, "");
    if (phone.length < 10) return setErrors({ phone: "Enter a valid 10-digit phone number" });
    setBusy(true);
    try {
      await post("/api/auth/send-phone-otp", { phone });
      setMode("phone-otp");
      push("OTP sent to your phone via SMS!", "info");
    } catch (err) {
      setErrors({ phone: err instanceof Error ? err.message : "Could not send OTP" });
    } finally {
      setBusy(false);
    }
  };

  const doVerifyPhoneOtp = async () => {
    if (form.code.trim().length !== 6) return setErrors({ code: "Enter the 6-digit code" });
    setBusy(true);
    try {
      await post("/api/auth/verify-phone-otp", { phone: form.phone, code: form.code });
      await finish("Signed in with phone!");
    } catch (err) {
      setErrors({ code: err instanceof Error ? err.message : "Wrong code" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={authOpen} onClose={close} title={mode === "otp" ? "Verify it's you" : mode === "phone-otp" ? "Verify your phone" : mode === "signup" ? "Create your account" : "Sign in to Trivilla"}>
      {mode !== "otp" && mode !== "phone-otp" && (
        <div className="mb-4 flex rounded-xl border border-line bg-white/60 p-1">
          {(["login", "phone", "signup"] as Mode[]).map((m) => (
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
              {m === "login" ? "Sign in" : m === "phone" ? "Phone" : "Sign up"}
            </button>
          ))}
        </div>
      )}

      {/* ---------- Email login / signup ---------- */}
      {(mode === "login" || mode === "signup" || mode === "otp") && (
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
              <div className="rounded-xl border border-[#d4e3d1] bg-[#f0f9ee] px-4 py-3">
                <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-[#3a7a28]"><Icon name="mail" size={14} /> OTP has been sent</p>
                <p className="mt-0.5 text-[12.5px] font-medium text-[#3a7a28]">
                  A 6-digit code has been sent to <strong>{form.email}</strong>.
                  It is valid for <strong>10 minutes</strong>.
                </p>
              </div>
              <Field label="6-digit code from your email" error={errors.code}>
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
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={busy}
                  className="text-[12.5px] font-bold text-brand hover:underline disabled:opacity-40"
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await post("/api/auth/resend-otp", { email: form.email });
                      push("New OTP sent! Please check your email", "info");
                    } catch (err) {
                      setErrors({ code: err instanceof Error ? err.message : "Could not resend" });
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Resend OTP
                </button>
                <span className="text-line">|</span>
                <button className="text-[12.5px] font-bold text-ink2 hover:text-ink" onClick={() => setMode("signup")}>
                  Wrong email? Go back
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ---------- Phone mode (enter number) ---------- */}
      {mode === "phone" && (
        <div className="space-y-3.5">
          <Field label="Phone number" error={errors.phone}>
            <Input
              placeholder="98xxx xxxxx"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSendPhoneOtp()}
            />
          </Field>
          {errors.form && (
            <p className="rounded-xl border border-[#ecc4ba] bg-chili-soft px-3.5 py-2.5 text-[12.5px] font-bold text-chili">{errors.form}</p>
          )}
          <Button full size="lg" loading={busy} onClick={doSendPhoneOtp} icon="arrow">
            Send OTP
          </Button>
        </div>
      )}

      {/* ---------- Phone OTP mode ---------- */}
      {mode === "phone-otp" && (
        <div className="space-y-3.5">
          <div className="rounded-xl border border-[#d4c3e0] bg-[#f4edfb] px-4 py-3">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-[#7a3fa0]">
              <Icon name="phone" size={14} /> OTP sent via SMS
            </p>
            <p className="mt-0.5 text-[12.5px] font-medium text-[#7a3fa0]">
              A 6-digit code has been sent to <strong>{form.phone}</strong>.
            </p>
          </div>
          <Field label="6-digit code from SMS" error={errors.code}>
            <Input
              placeholder="______"
              maxLength={6}
              inputMode="numeric"
              className="text-center font-mono text-lg tracking-[0.4em]"
              value={form.code}
              onChange={(e) => set("code", e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && doVerifyPhoneOtp()}
            />
          </Field>
          <Button full size="lg" loading={busy} onClick={doVerifyPhoneOtp} icon="check">
            Verify & sign in
          </Button>
          <div className="flex items-center justify-center gap-3">
            <button className="text-[12.5px] font-bold text-brand hover:underline" onClick={() => setMode("phone")}>
              Wrong number? Go back
            </button>
          </div>
        </div>
      )}

      {/* ---------- Social & auth ---------- */}
      {(mode === "login" || mode === "signup" || mode === "phone") && (
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
            Sign in securely with your Google account — we'll create a Trivilla profile for you.
          </p>
        </>
      )}

      {mode === "login" && (
        <div className="mt-5 rounded-xl border border-line bg-sand/70 px-4 py-3">
          <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink2">Quick login — tap a demo account</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[12px] font-semibold">
            {([
              { role: "Manager", email: "manager@trivilla.in", pass: "trivilla123", color: "brand", icon: "grid" as const },
              { role: "Customer", email: "priya@example.com", pass: "priya123", color: "leaf", icon: "user" as const },
              { role: "Chef", email: "chef@trivilla.in", pass: "chef123", color: "gold", icon: "chef" as const },
            ] as const).map((acc) => {
              const selected = form.email === acc.email && form.password === acc.pass;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, email: acc.email, password: acc.pass }));
                    setErrors({});
                  }}
                  className={`group relative overflow-hidden rounded-xl border-2 p-3 text-left transition-all active:scale-[0.97] ${
                    selected
                      ? acc.color === "brand"
                        ? "border-brand bg-white shadow-md"
                        : acc.color === "leaf"
                          ? "border-leaf bg-white shadow-md"
                          : "border-[#b98a2e] bg-white shadow-md"
                      : "border-transparent bg-white/80 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  {/* Selected indicator */}
                  {selected && (
                    <span className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-leaf text-[10px] text-white shadow">
                      <Icon name="check" size={10} />
                    </span>
                  )}

                  {/* Icon & Role */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition ${
                        selected
                          ? acc.color === "brand"
                            ? "bg-brand text-white"
                            : acc.color === "leaf"
                              ? "bg-leaf text-white"
                              : "bg-[#b98a2e] text-white"
                          : "bg-sand text-ink2 group-hover:text-ink"
                      }`}
                    >
                      <Icon name={acc.icon} size={13} />
                    </span>
                    <span
                      className={`truncate text-[11px] font-extrabold uppercase ${
                        selected
                          ? acc.color === "brand"
                            ? "text-brand-deep"
                            : acc.color === "leaf"
                              ? "text-leaf-deep"
                              : "text-[#7a5a12]"
                          : "text-ink2/70 group-hover:text-ink"
                      }`}
                    >
                      {acc.role}
                    </span>
                  </div>

                  {/* Credentials */}
                  <div className="mt-2 space-y-0.5">
                    <p className={`truncate text-[11px] font-bold ${selected ? "text-ink" : "text-ink2/80"}`}>{acc.email}</p>
                    <p className={`truncate text-[10px] font-medium ${selected ? "text-ink2/70" : "text-ink2/50"}`}>{acc.pass}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {form.email && form.password && (
            <p className="mt-2 text-center text-[11px] font-medium text-ink2 animate-fade-in">
              Credentials filled — tap <strong className="text-ink">Sign in</strong> above
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
