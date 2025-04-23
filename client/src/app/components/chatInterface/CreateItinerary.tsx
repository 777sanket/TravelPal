import { useState } from "react";
import { useRouter } from "next/navigation";
import { itineraryAPI } from "@/utils/api";
import { FiMapPin, FiCheck, FiTag } from "react-icons/fi";

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
    `Trip to ${travelPreferences.destination || "destination"}`
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

  // For manual tag management
  const [tags, setTags] = useState<string[]>([]);
  const router = useRouter();

  const rawResponse = messages
    .map((message: { content: string }) => message.content)
    .join(" ");

  // Add or remove a tag
  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      if (tags.length < 6) {
        setTags([...tags, tag]);
      }
    }
  };

  // Add a new custom tag
  const addCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim() && tags.length < 6) {
      const newTag = e.currentTarget.value.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      e.currentTarget.value = "";
    }
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
      const destination =
        travelPreferences.destination || extractDestinationFromMessages();

      // Include tags in the creation request
      const response = await itineraryAPI.createItinerary(
        chatId,
        title,
        destination,
        rawResponse,
        new Date(startDate),
        new Date(endDate),
        tags // Pass the manually entered tags
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

  // Extract destination from the first user message if not provided
  const extractDestinationFromMessages = (): string => {
    const firstUserMessage = messages.find((msg) => msg.role === "user");
    return firstUserMessage
      ? firstUserMessage.content.split(/[,.!?]/)[0].trim()
      : "destination";
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
            {/* Title field */}
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

            {/* Destination display */}
            <div>
              <label
                htmlFor="destination"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Destination
              </label>
              <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                <FiMapPin className="text-gray-500 mr-2" />
                <span>
                  {travelPreferences.destination ||
                    extractDestinationFromMessages()}
                </span>
              </div>
            </div>

            {/* Date fields */}
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

            {/* Manual Tags section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (max 6)
              </label>

              <div className="border border-gray-300 rounded-md p-3 bg-gray-50 mb-2">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex items-center cursor-pointer hover:bg-blue-200"
                      onClick={() => toggleTag(tag)}
                    >
                      <FiCheck className="mr-1" size={10} />
                      {tag}
                    </span>
                  ))}

                  {tags.length === 0 && (
                    <span className="text-gray-500 text-sm">
                      Add tags to categorize your itinerary (optional)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <FiTag className="text-gray-400 absolute ml-3" />
                <input
                  type="text"
                  placeholder="Add a tag (press Enter)"
                  className="w-full pl-9 px-3 py-2 border border-gray-300 rounded-md"
                  onKeyDown={addCustomTag}
                  disabled={tags.length >= 6}
                />
              </div>
              {tags.length >= 6 && (
                <p className="text-xs text-orange-500 mt-1">Maximum 6 tags</p>
              )}

              <p className="text-xs text-gray-500 mt-1">
                You can add your own tags, or the system will automatically
                suggest relevant tags.
              </p>
            </div>

            {/* Form buttons */}
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
