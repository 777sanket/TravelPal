"use client";

import { useState } from "react";
import Link from "next/link";
import { FiX, FiUser, FiLogIn } from "react-icons/fi";

interface LoginPopupProps {
  onClose: () => void;
}

export function LoginPopup({ onClose }: LoginPopupProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Join TravelPal</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <FiUser size={40} className="text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-medium mb-2">Sign in to continue</h3>
          <p className="text-gray-600 mb-6">
            You need to be logged in to chat with our travel assistant and
            create personalized itineraries.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <FiLogIn />
              Log in
            </Link>
            <Link
              href="/register"
              className="border border-blue-600 text-blue-600 py-2 px-4 rounded-md hover:bg-blue-50 transition-colors"
            >
              Create an account
            </Link>
            <button
              onClick={onClose}
              className="text-gray-600 py-2 px-4 hover:underline"
            >
              Continue as guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
