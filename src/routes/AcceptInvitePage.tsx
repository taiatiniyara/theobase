import { useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export default function AcceptInvitePage() {
  const { token } = useSearch({ from: "/accept-invite" });
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <img src="/icon.svg" alt="Theobase" className="mx-auto mb-4 h-10 w-auto" />
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg">
            <span className="text-2xl text-danger-text">✕</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Invalid Invitation</h1>
          <p className="mt-2 text-sm text-gray-600">
            No invitation token found. Please use the link from your invitation email.
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const apiBase = window.location.origin;
      const res = await fetch(`${apiBase}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "",
          password,
          fullName: fullName.trim(),
          inviteToken: token,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error ?? "Signup failed");
      }
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <img src="/icon.svg" alt="Theobase" className="mx-auto mb-4 h-10 w-auto" />
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-bg">
            <span className="text-2xl text-success-text">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Account Created</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your account has been created. Please log in to continue.
          </p>
          <Button className="mt-6" onClick={() => (window.location.href = "/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <img src="/icon.svg" alt="Theobase" className="mx-auto mb-4 h-10 w-auto" />
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Accept Invitation</h1>
        <p className="mb-6 text-center text-sm text-gray-600">Complete your account setup</p>

        {error && (
          <div className="mb-4 rounded bg-danger-bg p-3 text-sm text-danger-text">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="At least 8 characters"
          />
          <Input
            label="Confirm Password"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button type="submit" loading={submitting} className="w-full">
            Create Account
          </Button>
        </form>
      </div>
    </div>
  );
}
