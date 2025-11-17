"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

interface Movie {
  _id: string;
  title: string;
  publishingYear: number;
  posterPath?: string;
}

export default function EditMoviePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
    if (!token) {
      router.replace("/");
      return;
    }
    if (!id) return;

    async function fetchMovie() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/movies/${id}`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.message ?? "Failed to load movie");
          return;
        }
        const data: Movie = await res.json();
        setMovie(data);
        setTitle(data.title);
        setYear(String(data.publishingYear));
        if (data.posterPath) {
          const src = data.posterPath.startsWith("/")
            ? `${API_BASE_URL}${data.posterPath}`
            : data.posterPath;
          setPosterPreview(src);
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchMovie();
  }, [router, id]);

  function handlePosterChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPosterFile(file);
    if (posterPreview) {
      URL.revokeObjectURL(posterPreview);
    }
    if (file) {
      const url = URL.createObjectURL(file);
      setPosterPreview(url);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;

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

    setSaving(true);
    setError(null);

    try {
      const updateRes = await fetch(`${API_BASE_URL}/movies/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, publishingYear: numericYear }),
      });

      if (!updateRes.ok) {
        const data = await updateRes.json().catch(() => null);
        setError(data?.message ?? "Failed to update movie");
        return;
      }

      if (posterFile) {
        const formData = new FormData();
        formData.append("poster", posterFile);

        const posterRes = await fetch(`${API_BASE_URL}/movies/${id}/poster`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!posterRes.ok) {
          const data = await posterRes.json().catch(() => null);
          setError(data?.message ?? "Movie updated, but failed to upload poster");
        }
      }

      router.push("/movies");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/movies");
  }

  async function handleDelete() {
    if (!id) return;

    const confirmed = typeof window !== "undefined" ? window.confirm("Are you sure you want to delete this movie?") : true;
    if (!confirmed) return;

    const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
    if (!token) {
      router.replace("/");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/movies/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "Failed to delete movie");
        return;
      }

      router.push("/movies");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#093545] flex items-center justify-center text-white">
        Loading movie...
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#093545] flex items-center justify-center text-white">
        {error ?? "Movie not found"}
      </div>
    );
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
          <h1 className="text-2xl font-semibold mb-6">Edit movie</h1>
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
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 rounded-md border border-[#EB5757] text-[#EB5757] px-4 py-3 text-sm font-medium hover:bg-[#EB5757]/10 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-md border border-white/40 px-4 py-3 text-sm font-medium hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-md bg-[#2BD17E] text-[#093545] font-semibold px-4 py-3 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? "Updating..." : "Update"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
