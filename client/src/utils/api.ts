// Base API URL - replace with your actual API URL when deployed
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Helper function for making authenticated requests
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle unauthorized responses
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    return response;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Authentication APIs
export const authAPI = {
  register: async (
    name: string,
    email: string,
    mobile: string,
    password: string
  ) => {
    const response = await fetchWithAuth("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, mobile, password }),
    });

    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await fetchWithAuth("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    return response.json();
  },
};

// Chat APIs
export const chatAPI = {
  getChatHistory: async () => {
    const response = await fetchWithAuth("/chat");
    return response.json();
  },

  createChat: async (title: string) => {
    const response = await fetchWithAuth("/chat", {
      method: "POST",
      body: JSON.stringify({ title }),
    });

    return response.json();
  },

  sendMessage: async (chatId: string, message: string) => {
    const response = await fetchWithAuth("/chat/message", {
      method: "POST",
      body: JSON.stringify({ chatId, message }),
    });

    return response.json();
  },

  editChatTitle: async (chatId: string, title: string) => {
    const response = await fetchWithAuth(`/chat/edit/${chatId}`, {
      method: "PUT",
      body: JSON.stringify({ title }),
    });

    return response.json();
  },

  deleteChat: async (chatId: string) => {
    const response = await fetchWithAuth(`/chat/delete/${chatId}`, {
      method: "DELETE",
    });

    return response.json();
  },
};

// Itinerary APIs
export const itineraryAPI = {
  createItinerary: async (
    chatId: string,
    title: string,
    destination: string,
    rawResponse: string,
    startDate: Date,
    endDate: Date,
    preferences: string[]
  ) => {
    const response = await fetchWithAuth("/itinerary", {
      method: "POST",
      body: JSON.stringify({
        chatId,
        title,
        destination,
        rawResponse,
        startDate,
        endDate,
        preferences,
      }),
    });

    return response.json();
  },

  getItineraries: async () => {
    const response = await fetchWithAuth("/itinerary");
    return response.json();
  },

  getItineraryById: async (id: string) => {
    const response = await fetchWithAuth(`/itinerary/${id}`);
    return response.json();
  },

  updateItinerary: async (id: string, updates: any) => {
    const response = await fetchWithAuth(`/itinerary/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    return response.json();
  },
};
