"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { itineraryAPI } from "@/utils/api";
import { FiMapPin, FiCheck } from "react-icons/fi";

interface CreateItineraryProps {
  chatId: string;
  travelPreferences: {
    destination: string;
    startDate: Date | null;
    endDate: Date | null;
    cuisines: string[];
    placeTypes: string[];
    specialRequirements: string[];
    personalInterests: string[];
  };
  onClose: () => void;
  messages: {
    content: string;
    role: "user" | "assistant" | "system";
    timestamp?: string;
  }[];
}

export function CreateItinerary({
  chatId,
  travelPreferences,
  onClose,
  messages,
}: CreateItineraryProps) {
  const [title, setTitle] = useState(
    `Trip to ${travelPreferences.destination}`
  );
  const [startDate, setStartDate] = useState(
    travelPreferences.startDate
      ? travelPreferences.startDate.toISOString().split("T")[0]
      : ""
  );
  const [endDate, setEndDate] = useState(
    travelPreferences.endDate
      ? travelPreferences.endDate.toISOString().split("T")[0]
      : ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const rawResponse = messages.map((message) => message.content).join(" "); // Combine all message contents
  // console.log("Raw response:", rawResponse);

  // Gather all preferences as strings for API
  const getAllPreferences = () => {
    const allPrefs: string[] = [];

    if (travelPreferences.cuisines.length > 0) {
      allPrefs.push(...travelPreferences.cuisines);
    }

    if (travelPreferences.placeTypes.length > 0) {
      allPrefs.push(...travelPreferences.placeTypes);
    }

    if (travelPreferences.specialRequirements.length > 0) {
      allPrefs.push(...travelPreferences.specialRequirements);
    }

    if (travelPreferences.personalInterests.length > 0) {
      allPrefs.push(...travelPreferences.personalInterests);
    }

    return allPrefs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !startDate || !endDate) {
      setError("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await itineraryAPI.createItinerary(
        chatId,
        title,
        travelPreferences.destination,
        rawResponse,
        new Date(startDate),
        new Date(endDate)
        // getAllPreferences()
      );

      if (response.itinerary && response.itinerary._id) {
        router.push(`/itineraries/${response.itinerary._id}`);
      } else {
        throw new Error("Failed to create itinerary");
      }
    } catch (err: any) {
      console.error("Create itinerary error:", err);
      setError(err.message || "Failed to create itinerary");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Create Itinerary
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Itinerary Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="destination"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Destination
              </label>
              <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                <FiMapPin className="text-gray-500 mr-2" />
                <span>{travelPreferences.destination}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferences
              </label>
              <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                <div className="flex flex-wrap gap-2">
                  {getAllPreferences().map((pref, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex items-center"
                    >
                      <FiCheck className="mr-1" size={10} />
                      {pref}
                    </span>
                  ))}

                  {getAllPreferences().length === 0 && (
                    <span className="text-gray-500 text-sm">
                      No preferences specified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Itinerary"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Removed duplicate declaration of CreateItinerary
