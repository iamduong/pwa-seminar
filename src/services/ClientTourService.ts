import { LOCALSTORAGE_TOURS_KEY } from "../assets/config";
import type { Tour, TourPoi } from "../types/Tour";

function isTourPoi(value: unknown): value is TourPoi {
  if (!value || typeof value !== "object") return false;
  const poi = value as Partial<TourPoi>;
  return (
    typeof poi.id === "string" &&
    typeof poi.name === "string" &&
    typeof poi.address === "string"
  );
}

function isTour(value: unknown): value is Tour {
  if (!value || typeof value !== "object") return false;
  const tour = value as Partial<Tour>;
  return (
    typeof tour.id === "string" &&
    typeof tour.code === "string" &&
    (typeof tour.price === "string" || typeof tour.price === "number") &&
    typeof tour.max_people === "number" &&
    typeof tour.scanned_people === "number" &&
    typeof tour.expires_at === "string" &&
    !Number.isNaN(Date.parse(tour.expires_at)) &&
    typeof tour.created_at === "string" &&
    typeof tour.updated_at === "string" &&
    Array.isArray(tour.pois) &&
    tour.pois.every(isTourPoi)
  );
}

export function getSavedTours(): Tour[] {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_TOURS_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isTour) : [];
  } catch {
    return [];
  }
}

export function containTour(code: string): boolean {
  const tours = getSavedTours();
  return tours.find((t) => t.code == code) != null;
}

export function saveTour(tour: Tour): Tour[] {
  const tours = getSavedTours();
  const nextTours = [tour, ...tours.filter((item) => item.code !== tour.code)];
  localStorage.setItem(LOCALSTORAGE_TOURS_KEY, JSON.stringify(nextTours));
  return nextTours;
}

export function getSavedTour(code: string): Tour | undefined {
  return getSavedTours().find((tour) => tour.code === code);
}
