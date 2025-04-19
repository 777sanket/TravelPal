"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { itineraryAPI } from "@/utils/api";
import { Itinerary, Activity } from "@/types";
import {
  FiCalendar,
  FiMapPin,
  FiClock,
  FiArrowLeft,
  FiEdit2,
} from "react-icons/fi";

import { EditItineraryForm } from "@/app/components/EditItineraryForm";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ItineraryDetail({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        setIsLoading(true);
        const response = await itineraryAPI.getItineraryById(id);
        setItinerary(response.itinerary);
      } catch (err) {
        console.error("Error fetching itinerary:", err);
        setError("Failed to load itinerary details");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && id) {
      fetchItinerary();
    }
  }, [isAuthenticated, id]);

  // Handle editing itinerary
  const handleEditItinerary = async (updatedData: Partial<Itinerary>) => {
    if (!itinerary) return;

    try {
      setIsLoading(true);
      const response = await itineraryAPI.updateItinerary(id, updatedData);

      if (response.itinerary) {
        setItinerary(response.itinerary);
        setIsEditing(false);
      } else {
        throw new Error("Failed to update itinerary");
      }
    } catch (err) {
      console.error("Update itinerary error:", err);
      setError("Failed to update itinerary");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Format dates for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get activity color based on category
  const getActivityColor = (category: string = "") => {
    const colors: Record<string, string> = {
      food: "bg-orange-100 text-orange-800 border-orange-200",
      culture: "bg-purple-100 text-purple-800 border-purple-200",
      shopping: "bg-pink-100 text-pink-800 border-pink-200",
      sightseeing: "bg-blue-100 text-blue-800 border-blue-200",
      travel: "bg-gray-100 text-gray-800 border-gray-200",
      leisure: "bg-green-100 text-green-800 border-green-200",
      art: "bg-indigo-100 text-indigo-800 border-indigo-200",
      entertainment: "bg-yellow-100 text-yellow-800 border-yellow-200",
      landmark: "bg-sky-100 text-sky-800 border-sky-200",
    };

    return (
      colors[category.toLowerCase()] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          </div>
          <p className="text-gray-600">Loading itinerary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <Link
            href="/itineraries"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Back to Itineraries
          </Link>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-gray-500 text-lg mb-4">Itinerary not found</div>
          <Link
            href="/itineraries"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Back to Itineraries
          </Link>
        </div>
      </div>
    );
  }

  console.log("Preferences type:", typeof itinerary?.preferences);
  console.log("Preferences value:", itinerary?.preferences);

  return (
    <main className="flex min-h-screen flex-col">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center mb-4">
            <Link
              href="/itineraries"
              className="flex items-center text-white hover:text-blue-100 transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Back to Itineraries
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-2">{itinerary.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-blue-100">
            <div className="flex items-center">
              <FiMapPin className="mr-1" />
              <span>{itinerary.destination}</span>
            </div>
            <div className="flex items-center">
              <FiCalendar className="mr-1" />
              <span>
                {new Date(itinerary.startDate).toLocaleDateString()} -{" "}
                {new Date(itinerary.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center">
              <FiClock className="mr-1" />
              <span>
                {Math.ceil(
                  (new Date(itinerary.endDate).getTime() -
                    new Date(itinerary.startDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Your Itinerary
          </h2>
          <button
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            onClick={toggleEditMode}
          >
            <FiEdit2 className="mr-2" />
            {isEditing ? "Cancel Editing" : "Edit Itinerary"}
          </button>
        </div>

        {isEditing && itinerary ? (
          <EditItineraryForm
            itinerary={itinerary}
            onSave={handleEditItinerary}
            onCancel={toggleEditMode}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Trip Preferences
            </h3>
            <div className="flex flex-wrap gap-2">
              {itinerary?.preferences &&
              typeof itinerary.preferences === "object" ? (
                <>
                  {/* Handle cuisines */}
                  {Array.isArray(itinerary.preferences.cuisines) &&
                    itinerary.preferences.cuisines.map((pref, index) => (
                      <span
                        key={`cuisine-${index}`}
                        className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                      >
                        {pref}
                      </span>
                    ))}

                  {/* Handle placeTypes */}
                  {Array.isArray(itinerary.preferences.placeTypes) &&
                    itinerary.preferences.placeTypes.map((pref, index) => (
                      <span
                        key={`place-${index}`}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {pref}
                      </span>
                    ))}

                  {/* Handle specialRequirements */}
                  {Array.isArray(itinerary.preferences.specialRequirements) &&
                    itinerary.preferences.specialRequirements.map(
                      (pref, index) => (
                        <span
                          key={`req-${index}`}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                        >
                          {pref}
                        </span>
                      )
                    )}

                  {/* Handle otherInterests */}
                  {Array.isArray(itinerary.preferences.otherInterests) &&
                    itinerary.preferences.otherInterests.map((pref, index) => (
                      <span
                        key={`interest-${index}`}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                      >
                        {pref}
                      </span>
                    ))}
                </>
              ) : Array.isArray(itinerary?.preferences) ? (
                // Handle if preferences is an array (the original expected format)
                itinerary.preferences.map((pref, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {pref}
                  </span>
                ))
              ) : null}
            </div>
          </div>
        )}

        {/* Itinerary days */}
        <div className="space-y-6">
          {itinerary.days.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="bg-blue-500 text-white p-4">
                <h3 className="text-lg font-semibold">
                  Day {dayIndex + 1}: {formatDate(new Date(day.date))}
                </h3>
              </div>

              <div className="p-4">
                {day.activities.map((activity, activityIndex) => (
                  <div
                    key={activityIndex}
                    className={`border-l-4 pl-4 py-3 mb-4 ${getActivityColor(
                      activity.category
                    )}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {activity.time} - {activity.title}
                        </h4>
                        <p className="text-gray-600 mt-1">
                          {activity.description}
                        </p>

                        {activity.location && (
                          <div className="text-gray-500 text-sm mt-2 flex items-center">
                            <FiMapPin className="mr-1" size={14} />
                            <span>{activity.location}</span>
                          </div>
                        )}
                      </div>

                      {activity.category && (
                        <span className="text-xs uppercase font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                          {activity.category}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
