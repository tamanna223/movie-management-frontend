"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export default function NewMoviePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
    if (!token) {
      router.replace("/");
    }
  }, [router]);

  function handlePosterChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPosterFile(file);
    if (posterPreview) {
      URL.revokeObjectURL(posterPreview);
    }
    if (file) {
      const url = URL.createObjectURL(file);
      setPosterPreview(url);
    } else {
      setPosterPreview(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
    if (!token) {
      router.replace("/");
      return;
    }

    if (!title || !year) {
      setError("Title and publishing year are required.");
      return;
    }

    const numericYear = Number(year);
    if (Number.isNaN(numericYear)) {
      setError("Publishing year must be a number.");
      return;
    }

    if (numericYear < 1888 || numericYear > 3000) {
      setError("Publishing year must be between 1888 and 3000.");
      return;
    }

    setLoading(true);

    try {
      // Create movie first
      const createRes = await fetch(`${API_BASE_URL}/movies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, publishingYear: numericYear }),
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => null);
        setError(data?.message ?? "Failed to create movie");
        return;
      }

      const movie = await createRes.json();

      // Upload poster if provided
      if (posterFile) {
        const formData = new FormData();
        formData.append("poster", posterFile);

        const posterRes = await fetch(`${API_BASE_URL}/movies/${movie._id}/poster`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!posterRes.ok) {
          const data = await posterRes.json().catch(() => null);
          setError(data?.message ?? "Movie created, but failed to upload poster");
          // still redirect to list even if poster upload fails
        }
      }

      router.push("/movies");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    router.push("/movies");
  }

  return (
    <div className="min-h-screen bg-[#093545] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-[#092C39] rounded-2xl px-10 py-8 text-white shadow-lg flex flex-col md:flex-row gap-10">
        <div className="flex-1 flex items-center justify-center">
          <label className="flex h-64 w-full max-w-sm cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/40 bg-[#093545]/40 text-sm text-white/70 hover:border-[#2BD17E]">
            {posterPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={posterPreview}
                alt="Poster preview"
                className="h-full w-full object-cover rounded-2xl"
              />
            ) : (
              <span>Drop an image here or click to select</span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePosterChange} />
          </label>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold mb-6">Create a new movie</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md bg-[#224957] text-white placeholder:text-white/70 px-4 py-3 outline-none border border-transparent focus:border-[#2BD17E]"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Publishing year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-md bg-[#224957] text-white placeholder:text-white/70 px-4 py-3 outline-none border border-transparent focus:border-[#2BD17E]"
              />
            </div>
            {error && <p className="text-sm text-[#EB5757]">{error}</p>}
            <div className="mt-4 flex gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-md border border-white/40 px-4 py-3 text-sm font-medium hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md bg-[#2BD17E] text-[#093545] font-semibold px-4 py-3 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
