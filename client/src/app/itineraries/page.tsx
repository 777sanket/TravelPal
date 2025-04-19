"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { itineraryAPI } from "@/utils/api";
import { Itinerary } from "@/types";
import { FiCalendar, FiMapPin, FiClock, FiArrowRight } from "react-icons/fi";

export default function Itineraries() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        setIsLoading(true);
        const response = await itineraryAPI.getItineraries();

        // Convert string dates to Date objects before setting state
        const processedItineraries = response.itineraries.map((itinerary) => ({
          ...itinerary,
          startDate: new Date(itinerary.startDate),
          endDate: new Date(itinerary.endDate),
          createdAt: new Date(itinerary.createdAt),
          updatedAt: new Date(itinerary.updatedAt),
          // Ensure preferences is always an array
          preferences: Array.isArray(itinerary.preferences)
            ? itinerary.preferences
            : typeof itinerary.preferences === "string"
            ? itinerary.preferences.split(",").map((p) => p.trim())
            : [],
          days: Array.isArray(itinerary.days)
            ? itinerary.days.map((day) => ({
                ...day,
                date: new Date(day.date),
              }))
            : [],
        }));

        setItineraries(processedItineraries);
      } catch (err) {
        console.error("Error fetching itineraries:", err);
        setError("Failed to load itineraries");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchItineraries();
    }
  }, [isAuthenticated]);

  // Helper function to format date safely
  const formatDate = (date: Date | string) => {
    try {
      if (typeof date === "string") {
        return new Date(date).toLocaleDateString();
      }
      return date.toLocaleDateString();
    } catch (e) {
      console.error("Error formatting date:", date, e);
      return "Invalid date";
    }
  };

  // Calculate days between dates safely
  const calculateDays = (startDate: Date | string, endDate: Date | string) => {
    try {
      const start =
        typeof startDate === "string" ? new Date(startDate) : startDate;
      const end = typeof endDate === "string" ? new Date(endDate) : endDate;
      return Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
    } catch (e) {
      console.error("Error calculating days:", e);
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">My Itineraries</h1>
          <p className="text-blue-100">View and manage your travel plans</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          </div>
        ) : itineraries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itineraries.map((itinerary) => (
              <div
                key={itinerary._id}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="h-32 bg-gradient-to-r from-blue-400 to-indigo-500 flex items-end p-4">
                  <h3 className="text-xl font-bold text-white">
                    {itinerary.title}
                  </h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center text-gray-600 mb-3">
                    <FiMapPin className="mr-2" />
                    <span>{itinerary.destination}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-3">
                    <FiCalendar className="mr-2" />
                    <span>
                      {formatDate(itinerary.startDate)} -{" "}
                      {formatDate(itinerary.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-4">
                    <FiClock className="mr-2" />
                    <span>
                      {calculateDays(itinerary.startDate, itinerary.endDate)}{" "}
                      days
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {Array.isArray(itinerary.preferences)
                      ? itinerary.preferences.map((pref, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded"
                          >
                            {pref}
                          </span>
                        ))
                      : null}
                  </div>

                  <Link
                    href={`/itineraries/${itinerary._id}`}
                    className="flex items-center justify-center w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors mt-2"
                  >
                    View Itinerary <FiArrowRight className="ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              You don't have any itineraries yet
            </div>
            <Link
              href="/"
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Create Your First Itinerary
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
