const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

function headers(): HeadersInit {
  const key = import.meta.env.VITE_TMDB_API_KEY;
  if (!key) throw new Error("VITE_TMDB_API_KEY is not set");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export function posterUrl(path: string | null, size: "w342" | "w500" | "original" = "w500"): string {
  return path ? `${IMG}/${size}${path}` : "";
}

export function backdropUrl(path: string | null, size: "w1280" | "original" = "w1280"): string {
  return path ? `${IMG}/${size}${path}` : "";
}

/* ---- Types (subset of what we use) ---- */

export interface TmdbMovie {
  id: number;
  title: string;
  release_date: string; // "YYYY-MM-DD"
  runtime: number | null; // minutes
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: { id: number; name: string }[];
  vote_average: number;
  vote_count: number;
  status: string;
  tagline: string;
}

export interface TmdbCredits {
  cast: { id: number; name: string; character: string; order: number }[];
  crew: { id: number; name: string; job: string; department: string }[];
}

export interface TmdbReleaseDates {
  results: {
    iso_3166_1: string;
    release_dates: { certification: string; release_date: string; type: number }[];
  }[];
}

/* ---- Fetch helpers ---- */

export const fetchMovie = (id: number) => get<TmdbMovie>(`/movie/${id}`);
export const fetchCredits = (id: number) => get<TmdbCredits>(`/movie/${id}/credits`);

export interface TmdbMovieFull {
  movie: TmdbMovie;
  credits: TmdbCredits;
}

export async function fetchMovieFull(id: number): Promise<TmdbMovieFull> {
  const [movie, credits] = await Promise.all([fetchMovie(id), fetchCredits(id)]);
  return { movie, credits };
}

export function formatRuntime(minutes: number | null): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
