"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "Failed to sign up");
        return;
      }

      const data = await res.json();
      if (typeof window !== "undefined") {
        window.localStorage.setItem("accessToken", data.accessToken);
        window.localStorage.setItem("user", JSON.stringify(data.user));
      }

      router.push("/movies");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#093545] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#092C39] rounded-2xl px-10 py-12 shadow-lg text-center text-white">
        <h1 className="text-3xl font-semibold mb-8">Sign up</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-[#224957] text-white placeholder:text-white/70 px-4 py-3 outline-none border border-transparent focus:border-[#2BD17E]"
              required
            />
          </div>
          <div className="text-left">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md bg-[#224957] text-white placeholder:text-white/70 px-4 py-3 outline-none border border-transparent focus:border-[#2BD17E]"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-[#EB5757] text-left">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-md bg-[#2BD17E] text-[#093545] font-semibold py-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
