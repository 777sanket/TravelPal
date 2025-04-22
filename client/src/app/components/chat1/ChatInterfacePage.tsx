"use client";

import { useState, useRef, useEffect } from "react";
import {
  FiSend,
  FiPlus,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiTrash,
  FiEdit,
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { chatAPI } from "@/utils/api";
import { Message } from "@/types";
import { CreateItinerary } from "../CreateItinerary";

interface Chat {
  _id: string;
  title: string;
  messages: Message[];
}

export function ChatInterface1() {
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch chat history when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchChatHistory();
    }
  }, [isAuthenticated]);

  // Load or create chat on initial render
  useEffect(() => {
    const storedChatId = localStorage.getItem("currentChatId");

    if (storedChatId) {
      setCurrentChatId(storedChatId);
      setChatInitialized(true);

      // If we have a stored chat ID and user is authenticated, load the messages
      if (isAuthenticated) {
        loadChatMessages(storedChatId);
      }
    } else if (!chatInitialized && !currentChatId) {
      createNewChat();
    }
  }, [isAuthenticated]);

  // Fetch chat history
  const fetchChatHistory = async () => {
    if (!isAuthenticated) return;

    setIsLoadingHistory(true);
    try {
      const response = await chatAPI.getChatHistory();
      setChatHistory(response.chatHistory || []);
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load messages for a specific chat
  const loadChatMessages = async (chatId: string) => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      // Find the chat in our history
      const chat = chatHistory.find((c) => c._id === chatId);

      if (chat && chat.messages.length > 0) {
        // Update current chat data
        setMessages(chat.messages);
        setCurrentChatId(chatId);
        localStorage.setItem("currentChatId", chatId);

        // Update travel preferences based on the chat
        updateTravelPreferencesFromChat(chat.messages);
      } else {
        // If chat not found in history, fetch it from the server
        await fetchChatHistory();
        const updatedChat = chatHistory.find((c) => c._id === chatId);
        if (updatedChat) {
          setMessages(updatedChat.messages);
          updateTravelPreferencesFromChat(updatedChat.messages);
        }
      }
    } catch (error) {
      console.error("Failed to load chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new chat
  const createNewChat = async () => {
    localStorage.removeItem("currentChatId");

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

        // Update the chat history
        await fetchChatHistory();
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

  // Delete a chat
  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return;

    try {
      await chatAPI.deleteChat(chatId);

      // Update chat history
      setChatHistory((prev) => prev.filter((chat) => chat._id !== chatId));

      // If the deleted chat was the current one, create a new chat
      if (currentChatId === chatId) {
        createNewChat();
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  // Edit chat title
  const startEditingTitle = (
    chatId: string,
    currentTitle: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
  };

  const saveEditedTitle = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !editTitle.trim()) {
      setEditingChatId(null);
      return;
    }

    try {
      await chatAPI.editChatTitle(chatId, editTitle);

      // Update chat history
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat._id === chatId ? { ...chat, title: editTitle } : chat
        )
      );

      setEditingChatId(null);
    } catch (error) {
      console.error("Failed to update chat title:", error);
    }
  };

  // Update travel preferences based on chat messages
  const updateTravelPreferencesFromChat = (chatMessages: Message[]) => {
    // This is a simplified version - you may need to adapt this based on your actual data structure
    let destination = "";

    // Find the first user message which likely contains the destination
    const firstUserMessage = chatMessages.find((msg) => msg.role === "user");
    if (firstUserMessage) {
      destination = firstUserMessage.content;
    }

    setTravelPreferences((prev) => ({
      ...prev,
      destination,
    }));
  };

  const isConversationComplete = () => {
    return messages.length >= 3;
  };

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

        setMessages((prev) => [
          ...prev.slice(0, -1),
          response.conversation[response.conversation.length - 2] ||
            userMessage,
          response.message,
        ]);

        // Update chat history after sending a message
        await fetchChatHistory();
      } else {
        setTimeout(() => {
          let responseContent = "";
          const messageCount = messages.length;

          if (messageCount === 1) {
            responseContent = `Great choice! When are you planning to visit ${userMessage.content}? Please provide start and end dates.`;
            setTravelPreferences((prev) => ({
              ...prev,
              destination: userMessage.content,
            }));
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

  // Get chat title for display
  const getChatTitle = () => {
    if (travelPreferences.destination) {
      return `Trip to ${travelPreferences.destination}`;
    }

    if (currentChatId && isAuthenticated) {
      const currentChat = chatHistory.find(
        (chat) => chat._id === currentChatId
      );
      if (currentChat) {
        return currentChat.title;
      }
    }

    return "New Conversation";
  };

  return (
    <div className="flex h-[600px] border border-gray-200 rounded-lg">
      {/* Chat History Sidebar */}
      <div
        className={`h-full bg-white border-r border-gray-200 transition-all duration-300 
          ${sidebarOpen ? "w-64" : "w-0 md:w-12"}`}
      >
        {sidebarOpen ? (
          <>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-medium text-gray-800">Chat History</h3>
              <button
                className="p-1 rounded-md hover:bg-gray-100"
                onClick={() => setSidebarOpen(false)}
              >
                <FiChevronLeft size={20} />
              </button>
            </div>

            <div className="overflow-y-auto h-[calc(100%-64px)]">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center h-16">
                  <div className="loader">Loading...</div>
                </div>
              ) : !isAuthenticated ? (
                <div className="p-4 text-sm text-gray-500">
                  Please login to see your chat history
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                  No previous chats found
                </div>
              ) : (
                <div>
                  {chatHistory.map((chat) => (
                    <div
                      key={chat._id}
                      className={`p-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center ${
                        currentChatId === chat._id ? "bg-blue-50" : ""
                      }`}
                      onClick={() => loadChatMessages(chat._id)}
                    >
                      <div className="flex-1 min-w-0">
                        {editingChatId === chat._id ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full p-1 border border-gray-300 rounded"
                            autoFocus
                          />
                        ) : (
                          <div className="truncate text-sm">{chat.title}</div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {editingChatId === chat._id ? (
                          <button
                            onClick={(e) => saveEditedTitle(chat._id, e)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            Save
                          </button>
                        ) : (
                          <>
                            <FiEdit
                              className="text-gray-500 hover:text-blue-500"
                              size={16}
                              onClick={(e) =>
                                startEditingTitle(chat._id, chat.title, e)
                              }
                            />
                            <FiTrash
                              className="text-gray-500 hover:text-red-500"
                              size={16}
                              onClick={(e) => deleteChat(chat._id, e)}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex justify-center pt-4">
            <button
              className="p-2 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-full">
        {/* Chat header */}
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <div className="flex items-center">
            {!sidebarOpen && (
              <button
                className="mr-2 p-1 rounded-md hover:bg-gray-100 md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <FiChevronRight size={20} />
              </button>
            )}
            <h3 className="font-medium text-gray-800">{getChatTitle()}</h3>
          </div>
          <button
            className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
            onClick={createNewChat}
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

        {/* Travel Preferences Summary */}
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
    </div>
  );
}
