"use client";

import { useState, useRef, useEffect } from "react";
import { FiSend, FiPlus, FiFileText } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { chatAPI } from "@/utils/api";
import { Message } from "@/types";
import { CreateItinerary } from "./CreateItinerary";
import { LoginPopup } from "./layouts/LoginPopUp";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your travel planning assistant. I'm here to help you plan the perfect trip. Where would you like to travel to?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [travelPreferences, setTravelPreferences] = useState({
    destination: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    cuisines: [] as string[],
    placeTypes: [] as string[],
    specialRequirements: [] as string[],
    personalInterests: [] as string[],
  });
  const [showCreateItinerary, setShowCreateItinerary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();

  const [chatInitialized, setChatInitialized] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const storedChatId = localStorage.getItem("currentChatId");

    if (storedChatId) {
      setCurrentChatId(storedChatId);
      setChatInitialized(true);
    } else if (!chatInitialized && !currentChatId) {
      const createNewChat = async () => {
        try {
          // if (!isAuthenticated) {
          //   const tempId = "temp-" + Date.now();
          //   setCurrentChatId(tempId);
          //   localStorage.setItem("currentChatId", tempId);
          //   return;
          // }

          const response = await chatAPI.createChat("New Travel Plan");
          setCurrentChatId(response.chatId);
          localStorage.setItem("currentChatId", response.chatId);

          if (
            response.chat &&
            response.chat.messages &&
            response.chat.messages.length > 0
          ) {
            setMessages(response.chat.messages);
          }
        } catch (error) {
          console.error("Failed to create chat:", error);
          // Fallback to a temporary ID
          // const tempId = "temp-" + Date.now();
          // setCurrentChatId(tempId);
          // localStorage.setItem("currentChatId", tempId);
        } finally {
          setChatInitialized(true);
        }
      };

      createNewChat();
    }
  }, [currentChatId, isAuthenticated, chatInitialized]);

  const isConversationComplete = () => {
    return messages.length >= 3;
  };

  useEffect(() => {
    if (messages.length <= 1) return;

    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((msg) => msg.role === "user");

    if (!lastUserMessage) return;

    const messageCount = messages.length;

    if (messageCount === 2) {
      setTravelPreferences((prev) => ({
        ...prev,
        destination: "Travel Destination",
      }));
    } else if (messageCount === 4) {
      setTravelPreferences((prev) => ({
        ...prev,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }));
    } else if (messageCount === 6) {
      setTravelPreferences((prev) => ({
        ...prev,
        cuisines: lastUserMessage.content.split(",").map((c) => c.trim()),
      }));
    } else if (messageCount === 8) {
      setTravelPreferences((prev) => ({
        ...prev,
        placeTypes: lastUserMessage.content.split(",").map((p) => p.trim()),
      }));
    } else if (messageCount === 10) {
      setTravelPreferences((prev) => ({
        ...prev,
        specialRequirements: lastUserMessage.content
          .split(",")
          .map((r) => r.trim()),
      }));
    } else if (messageCount === 12) {
      setTravelPreferences((prev) => ({
        ...prev,
        personalInterests: lastUserMessage.content
          .split(",")
          .map((i) => i.trim()),
      }));
    }
  }, [messages]);

  //Loging in popup

  // Handle sending messages
  const handleSendMessage = async () => {
    if (input.trim() === "" || !currentChatId) return;

    if (!currentChatId) {
      try {
        if (!isAuthenticated) {
          const tempId = "temp-" + Date.now();
          setCurrentChatId(tempId);
          localStorage.setItem("currentChatId", tempId);
        } else {
          const response = await chatAPI.createChat("New Travel Plan");
          setCurrentChatId(response.chatId);
          localStorage.setItem("currentChatId", response.chatId);
        }
        setChatInitialized(true);
      } catch (error) {
        console.error("Failed to create chat:", error);
        const tempId = "temp-" + Date.now();
        setCurrentChatId(tempId);
        localStorage.setItem("currentChatId", tempId);
        setChatInitialized(true);
      }
    }

    // Add user message to UI immediately for better UX
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (isAuthenticated) {
        const response = await chatAPI.sendMessage(currentChatId, input);
        console.log("API response:", response);

        setMessages((prev) => [
          ...prev.slice(0, -1),
          response.conversation[response.conversation.length - 2] ||
            userMessage,
          response.message,
        ]);
      } else {
        setTimeout(() => {
          let responseContent = "";
          const messageCount = messages.length;

          if (messageCount === 1) {
            responseContent = `Great choice! When are you planning to visit ${userMessage.content}? Please provide start and end dates.`;
          } else if (messageCount === 3) {
            responseContent = `Wonderful! Do you have any preferred cuisines you'd like to try during your trip?`;
          } else if (messageCount === 5) {
            responseContent = `Noted! What types of places do you enjoy visiting? (e.g., beaches, museums, nature, shopping, etc.)`;
          } else if (messageCount === 7) {
            responseContent = `Do you have any special requirements for this trip? (e.g., family-friendly, solo travel, pet-friendly)`;
          } else if (messageCount === 9) {
            responseContent = `Almost done! Are there any other personal interests you'd like me to consider when creating your itinerary?`;
          } else if (messageCount === 11) {
            const destination =
              travelPreferences.destination || "your destination";
            responseContent = `Thank you for sharing all that information! Based on your preferences, I'll create a personalized itinerary for ${destination}. You'll be able to view and customize it soon.`;
          } else {
            responseContent = `I understand. Is there anything else you'd like to share about your travel plans?`;
          }

          const assistantMessage: Message = {
            role: "assistant",
            content: responseContent,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Add error message to the chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I couldn't process your message. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      if (isAuthenticated) {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage();
    }
  };

  const handleNewChat = async () => {
    // Clear localStorage
    localStorage.removeItem("currentChatId");
    // setShowChat(true);

    // Reset component state
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm your travel planning assistant. I'm here to help you plan the perfect trip. Where would you like to travel to?",
        timestamp: new Date(),
      },
    ]);

    setTravelPreferences({
      destination: "",
      startDate: null,
      endDate: null,
      cuisines: [],
      placeTypes: [],
      specialRequirements: [],
      personalInterests: [],
    });

    setIsLoading(true);

    try {
      if (!isAuthenticated) {
        const tempId = "temp-" + Date.now();
        setCurrentChatId(tempId);
        localStorage.setItem("currentChatId", tempId);
      } else {
        const response = await chatAPI.createChat("New Travel Plan");
        setCurrentChatId(response.chatId);
        localStorage.setItem("currentChatId", response.chatId);
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I couldn't start a new conversation. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatInitialized(true);
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

      if (isNaN(date.getTime())) {
        return "";
      }

      return `${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-gray-200 rounded-lg">
      {/* Chat header */}
      <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
        <h3 className="font-medium text-gray-800">
          {travelPreferences.destination
            ? `Trip to ${travelPreferences.destination}`
            : "New Conversation"}
        </h3>
        <button
          className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
          onClick={handleNewChat}
        >
          <FiPlus size={16} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.role === "user"
                ? "flex justify-end"
                : "flex justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === "user" ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {formatTimestamp(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-gray-500">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center">
          <textarea
            className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Type your message..."
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
          />
          <button
            className="ml-2 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSendMessage}
            // disabled={isLoading || input.trim() === "" || !currentChatId}
            disabled={
              isLoading ||
              input.trim() === "" ||
              (isAuthenticated &&
                (!currentChatId || currentChatId.startsWith("temp-")))
            }
          >
            <FiSend size={20} />
          </button>
        </div>
      </div>

      {/* Travel Preferences Summary (can be hidden initially) */}
      {messages && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="bg-gray-50 p-3 rounded-lg">
            {isConversationComplete() && isAuthenticated && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setShowCreateItinerary(true)}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  <FiFileText />
                  Create Itinerary
                </button>
              </div>
            )}

            {isConversationComplete() && !isAuthenticated && (
              <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                <p className="font-medium">Your trip is ready!</p>
                <p className="mt-1">
                  Please{" "}
                  <a href="/login" className="underline">
                    login
                  </a>{" "}
                  or{" "}
                  <a href="/register" className="underline">
                    register
                  </a>{" "}
                  to create and save your itinerary.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Itinerary Modal */}
      {showCreateItinerary && currentChatId && (
        <CreateItinerary
          chatId={currentChatId}
          travelPreferences={travelPreferences}
          onClose={() => setShowCreateItinerary(false)}
          messages={messages}
        />
      )}
    </div>
  );
}
