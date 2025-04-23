import { Request, Response, NextFunction, RequestHandler } from "express";
import fetch from "node-fetch";
import ChatHistory from "../models/ChatHistory";
import mongoose from "mongoose";

// Define extended Request type that includes user property
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

const callAIModel = async (
  messages: any[],
  systemPrompt: string = ""
): Promise<string> => {
  try {
    // Prepare messages array with optional system message
    const messageArray = systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
          "X-Title": "TravelPal",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-maverick:free",
          messages: messageArray,
          temperature: 0.7,
        }),
      }
    );

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    // Add check and log full response
    if (!data?.choices || !data.choices[0]?.message?.content) {
      console.error("Unexpected AI response:", JSON.stringify(data, null, 2));
      throw new Error("Invalid response from AI model");
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI model call error:", error);
    throw new Error("Failed to get response from AI model");
  }
};

// Get chat history for user
export const getChatHistory: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;

    let chatHistory = await ChatHistory.findOne({ userId });

    if (!chatHistory) {
      chatHistory = new ChatHistory({ userId, chats: [] });
      await chatHistory.save();
    }

    res.json({ chatHistory: chatHistory.chats });
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new chat with travel-specific welcome message
export const createChat: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { title } = req.body;

    let chatHistory = await ChatHistory.findOne({ userId });

    if (!chatHistory) {
      chatHistory = new ChatHistory({ userId, chats: [] });
    }

    // Create a more travel-focused welcome message
    const welcomeMessage = {
      role: "assistant" as const,
      content:
        "Hello! I'm your personal travel planning assistant. I'm here to help you create the perfect trip itinerary. To get started, could you tell me where you'd like to travel to?",
      timestamp: new Date(),
    };

    const newChat = {
      _id: new mongoose.Types.ObjectId(), // Generate a unique ID
      title,
      messages: [welcomeMessage],
    };

    chatHistory.chats.push(newChat);
    await chatHistory.save();

    res.status(201).json({
      chatId: chatHistory.chats[chatHistory.chats.length - 1]._id,
      chat: newChat,
    });
  } catch (error) {
    console.error("Create chat error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Send message to chat with guided travel planning
export const sendMessage: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { chatId, message } = req.body;

    const chatHistory = await ChatHistory.findOne({ userId });

    if (!chatHistory) {
      res.status(404).json({ message: "Chat history not found" });
      return;
    }

    const chatIndex = chatHistory.chats.findIndex(
      (chat) => chat._id.toString() === chatId
    );

    if (chatIndex === -1) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    // Add user message
    const userMessage = {
      role: "user" as const,
      content: message,
      timestamp: new Date(),
    };

    chatHistory.chats[chatIndex].messages.push(userMessage);

    // Format messages for the AI model
    const aiMessages = chatHistory.chats[chatIndex].messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Create a system prompt that guides the AI to ask travel-specific questions
    const systemPrompt = `
You are a friendly and helpful travel planning assistant named TravelPal. Your goal is to guide the user through planning their perfect trip by asking relevant questions in a natural conversational way.

Follow this general order of questions, but make the conversation feel natural and not like a rigid form:
1. Where they want to travel (if not already mentioned)
2. When they plan to travel (start and end dates)
3. Preferred cuisines they'd like to try
4. Types of places they enjoy (beaches, museums, nature, shopping, etc.)
5. Special requirements (family-friendly, solo travel, pet-friendly, accessibility needs, etc.)
6. Any other personal interests to include in the trip

Guidelines:
- Be warm, friendly, and conversational
- Ask one question at a time
- Show enthusiasm about their travel plans
- If they've already answered a question, don't ask it again
- Acknowledge their preferences and build on them
- Offer gentle suggestions when appropriate
- Be concise but friendly in your responses
- Only move to the next question when they've answered the current one

After collecting all preferences, summarize what you've learned and tell them you can create a personalized itinerary based on their preferences.
`;

    // Call AI model with system prompt
    const aiResponse = await callAIModel(aiMessages, systemPrompt);

    // Add AI response to chat history
    const assistantMessage = {
      role: "assistant" as const,
      content: aiResponse,
      timestamp: new Date(),
    };

    chatHistory.chats[chatIndex].messages.push(assistantMessage);
    await chatHistory.save();

    res.json({
      message: assistantMessage,
      conversation: chatHistory.chats[chatIndex].messages,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a chat
export const deleteChat: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { chatId } = req.params;

    const chatHistory = await ChatHistory.findOne({ userId });
    if (!chatHistory) {
      res.status(404).json({ message: "Chat history not found" });
      return;
    }

    const originalLength = chatHistory.chats.length;
    chatHistory.chats = chatHistory.chats.filter(
      (chat) => chat._id.toString() !== chatId
    );

    if (chatHistory.chats.length === originalLength) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    await chatHistory.save();

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Delete chat error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Edit chat title
export const editChatTitle: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { chatId } = req.params;
    const { title } = req.body;

    const chatHistory = await ChatHistory.findOne({ userId });
    if (!chatHistory) {
      res.status(404).json({ message: "Chat history not found" });
      return;
    }

    const chat = chatHistory.chats.find(
      (chat) => chat._id.toString() === chatId
    );

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    chat.title = title;
    await chatHistory.save();

    res.json({ message: "Chat title updated successfully", chat });
  } catch (error) {
    console.error("Edit chat title error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const extractTravelPreferences: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res
        .status(400)
        .json({ message: "Invalid request. Messages array is required." });
      return;
    }

    // Updated system prompt with clearer JSON instructions
    const systemPrompt = `
You are a travel preference extraction assistant. Your ONLY task is to analyze the conversation and extract travel preferences.

Extract the following information:
1. Destination: The main place the user wants to visit
2. Date information: Any mentions of travel dates (start and end)
3. Cuisine preferences: What foods or dining experiences they're interested in
4. Place types: What kinds of attractions, locations, or places they want to visit
5. Special requirements: Any specific needs or constraints (family-friendly, accessibility, etc.)
6. Personal interests: Activities or experiences they specifically mentioned enjoying

IMPORTANT: Your response must be ONLY valid JSON with no explanatory text before or after. 
Do not include any other text, explanations, or formatting - just the JSON object.

Use this exact format:
{
  "destination": "string",
  "dates": { "startDate": "YYYY-MM-DD or null", "endDate": "YYYY-MM-DD or null" },
  "cuisines": ["string", "string"],
  "placeTypes": ["string", "string"],
  "specialRequirements": ["string", "string"],
  "personalInterests": ["string", "string"]
}

If information is missing, use empty arrays [] or null values.
    `;

    // Prepare conversation for AI
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Call AI model with explicit JSON formatting
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
          "X-Title": "TravelPal",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-maverick:free",
          messages: aiMessages,
          temperature: 0.1, // Even lower temperature for more deterministic outputs
          response_format: { type: "json_object" }, // Explicitly request JSON
        }),
      }
    );

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    if (!data?.choices || !data.choices[0]?.message?.content) {
      console.error("Unexpected AI response:", JSON.stringify(data, null, 2));
      res.status(500).json({ message: "Failed to extract travel preferences" });
      return;
    }

    // Parse the JSON response with additional error handling
    let preferences;
    try {
      // Try to clean the response before parsing
      const content = data.choices[0].message.content;
      // Remove any explanatory text before or after the JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }

      const jsonString = jsonMatch[0];
      preferences = JSON.parse(jsonString);
    } catch (error) {
      console.error("Error parsing AI response as JSON:", error);
      console.error("Raw AI response:", data.choices[0].message.content);
      res.status(500).json({
        message: "Failed to parse travel preferences",
        rawResponse: data.choices[0].message.content,
      });
      return;
    }

    res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error("Extract preferences error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
