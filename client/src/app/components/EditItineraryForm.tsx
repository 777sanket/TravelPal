"use client";

import { useState } from "react";
import { Itinerary } from "@/types";
import { FiSave, FiX } from "react-icons/fi";

interface EditItineraryFormProps {
  itinerary: Itinerary;
  onSave: (updatedData: Partial<Itinerary>) => void;
  onCancel: () => void;
}

export function EditItineraryForm({
  itinerary,
  onSave,
  onCancel,
}: EditItineraryFormProps) {
  // Convert startDate to string format safely
  const formatDateForInput = (dateValue: Date | string): string => {
    if (!dateValue) return "";

    try {
      // If it's already a Date object
      if (dateValue instanceof Date) {
        return dateValue.toISOString().split("T")[0];
      }

      // If it's a string, try to create a Date object
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }

      // If it's already in YYYY-MM-DD format, return as is
      if (
        typeof dateValue === "string" &&
        dateValue.match(/^\d{4}-\d{2}-\d{2}$/)
      ) {
        return dateValue;
      }

      // Fallback
      return "";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const [title, setTitle] = useState(itinerary.title);
  const [startDate, setStartDate] = useState(
    formatDateForInput(itinerary.startDate)
  );
  const [endDate, setEndDate] = useState(formatDateForInput(itinerary.endDate));
  const [preferences, setPreferences] = useState(
    Array.isArray(itinerary.preferences) ? itinerary.preferences.join(", ") : ""
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const updatedData: Partial<Itinerary> = {
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      preferences: preferences
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p),
    };

    onSave(updatedData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Edit Itinerary Details
      </h3>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <label
            htmlFor="preferences"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Preferences (comma-separated)
          </label>
          <textarea
            id="preferences"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter your preferences separated by commas, e.g., &quot;food,
            culture, museums, beach&quot;
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isLoading}
          >
            <FiX className="mr-2" />
            Cancel
          </button>

          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            <FiSave className="mr-2" />
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
