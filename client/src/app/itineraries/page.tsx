"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { itineraryAPI } from "@/utils/api";
import { Itinerary } from "@/types";
import {
  FiCalendar,
  FiMapPin,
  FiClock,
  FiArrowRight,
  FiTag,
} from "react-icons/fi";
import { RiDeleteBinLine } from "react-icons/ri";

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
        const processedItineraries = response.itineraries.map(
          (itinerary: Itinerary) => ({
            ...itinerary,
            startDate: new Date(itinerary.startDate),
            endDate: new Date(itinerary.endDate),
            createdAt: new Date(itinerary.createdAt),
            updatedAt: new Date(itinerary.updatedAt),
            // Ensure tags is always an array
            tags: Array.isArray(itinerary.tags) ? itinerary.tags : [],
          })
        );

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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this itinerary?")) {
      try {
        const response = await itineraryAPI.deleteItinerary(id);

        if (response) {
          setItineraries((prev) =>
            prev.filter((itinerary) => itinerary._id !== id)
          );
          alert("Itinerary deleted successfully");
        } else {
          alert("Failed to delete itinerary");
        }
      } catch (err) {
        console.error("Error deleting itinerary:", err);
        alert("Failed to delete itinerary");
      }
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
                className="relative bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <button
                  className="absolute top-2 right-2 backdrop-blur-3xl bg-red-500/50 text-white rounded-full p-2 cursor-pointer hover:bg-red-600 transition-colors"
                  onClick={() => handleDelete(itinerary._id)}
                >
                  <RiDeleteBinLine className="w-5 h-5" />
                </button>
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

                  {/* Tags section */}
                  {itinerary.tags && itinerary.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <div className="flex items-center text-gray-600 mb-2 w-full">
                        <FiTag className="mr-2" />
                        <span className="text-sm">Tags:</span>
                      </div>
                      {itinerary.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

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
              You don&apos;t have any itineraries yet
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
