"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

interface Movie {
  _id: string;
  title: string;
  publishingYear: number;
  posterPath?: string;
}

interface MoviesResponse {
  data: Movie[];
  total: number;
  page: number;
  limit: number;
}

export default function MoviesPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
    if (!token) {
      router.replace("/");
      return;
    }

    async function fetchMovies(currentPage: number) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/movies?page=${currentPage}&limit=${limit}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.message ?? "Failed to load movies");
          return;
        }

        const data: MoviesResponse = await res.json();
        setMovies(data.data);
        setTotal(data.total);
        setPage(data.page);
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchMovies(page);
  }, [router, page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function handleAddMovie() {
    router.push("/movies/new");
  }

  function handleLogout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("user");
    }
    router.replace("/");
  }

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  }

  return (
    <div className="min-h-screen bg-[#093545] flex items-center justify-center px-4 py-10">
      <div className="w-[90%] h-[90vh] bg-[#092C39] rounded-2xl px-10 py-8 text-white shadow-lg overflow-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My movies</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-white/80 hover:text-white underline-offset-2 hover:underline"
          >
            Logout
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-[#EB5757]">{error}</p>}

        {loading ? (
          <p className="text-center text-white/80">Loading movies...</p>
        ) : total === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <p className="text-xl">Your movie list is empty</p>
            <button
              onClick={handleAddMovie}
              className="rounded-md bg-[#2BD17E] text-[#093545] font-semibold px-6 py-2"
            >
              Add a new movie
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-end">
              <button
                onClick={handleAddMovie}
                className="rounded-md bg-[#2BD17E] text-[#093545] font-semibold px-6 py-2"
              >
                Add a new movie
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {movies.map((movie) => {
                const posterSrc = movie.posterPath
                  ? movie.posterPath.startsWith('http')
                    ? movie.posterPath
                    : `${API_BASE_URL}${movie.posterPath}`
                  : null;

                return ( 
                  <div
                    key={movie._id}
                    className="bg-[#224957] rounded-xl overflow-hidden shadow cursor-pointer flex flex-col"
                    onClick={() => router.push(`/movies/${movie._id}/edit`)}
                  >
                    {posterSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={posterSrc}
                        alt={movie.title}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="h-40 w-full bg-[#092C39] flex items-center justify-center text-xs text-white/60">
                        No poster
                      </div>
                    )}
                  <div className="p-2 flex flex-col gap-1">
                    <p className="font-semibold text-sm truncate">{movie.title}</p>
                    <p className="text-xs text-white/70">{movie.publishingYear}</p>
                  </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4 text-sm">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-[#224957] disabled:opacity-50"
                >
                  Prev
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded bg-[#224957] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
