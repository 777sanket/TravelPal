"use client";

import Link from "next/link";
import { FiMapPin, FiCalendar, FiList, FiAward, FiMap } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <main className="flex min-h-screen  flex-col items-center">
      {/* Hero Section */}
      <div className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Plan Your Dream Trip with AI
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Your personal travel assistant powered by artificial intelligence
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#chat"
              className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Start Planning
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          How TravelPal Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <FiMapPin size={32} className="text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Tell Us Where
            </h3>
            <p className="text-gray-600">
              Share your destination preferences and travel dates with our AI
              assistant.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-purple-100 p-4 rounded-full">
                <FiList size={32} className="text-purple-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              AI Creates Itinerary
            </h3>
            <p className="text-gray-600">
              Our AI analyzes your preferences and creates a personalized travel
              plan.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <FiMap size={32} className="text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Enjoy Your Trip
            </h3>
            <p className="text-gray-600">
              Review, customize, and use your detailed day-by-day itinerary on
              your journey.
            </p>
          </div>
        </div>
      </div>

      {/* Move To chat Page Button */}
      <div id="chat" className=" bg-gray-50 w-full py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Ready to Start Planning?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Let our AI create a personalized itinerary for your next adventure.
          </p>
          {isAuthenticated ? (
            <Link
              href="/chatPage"
              className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Start Planning Now
            </Link>
          ) : (
            <Link
              href="/login"
              className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Login to Start Planning
            </Link>
          )}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50 w-full py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Why Choose TravelPal
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <FiAward className="text-blue-600" size={20} />
                </div>
                <h3 className="font-semibold text-lg">Personalized</h3>
              </div>
              <p className="text-gray-600">
                Tailored recommendations based on your specific interests and
                preferences.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <FiCalendar className="text-green-600" size={20} />
                </div>
                <h3 className="font-semibold text-lg">Time-Saving</h3>
              </div>
              <p className="text-gray-600">
                Create complete itineraries in minutes instead of hours of
                research.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-2 rounded-full mr-3">
                  <FiMapPin className="text-purple-600" size={20} />
                </div>
                <h3 className="font-semibold text-lg">Local Insights</h3>
              </div>
              <p className="text-gray-600">
                Discover hidden gems and authentic experiences beyond typical
                tourist spots.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="bg-orange-100 p-2 rounded-full mr-3">
                  <FiMap className="text-orange-600" size={20} />
                </div>
                <h3 className="font-semibold text-lg">Flexible</h3>
              </div>
              <p className="text-gray-600">
                Easily customize and adjust your itinerary to fit your changing
                plans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
