import { Request, Response, NextFunction, RequestHandler } from "express";
import fetch from "node-fetch";
import ChatHistory from "../models/ChatHistory";
import Itinerary from "../models/Itinerary";
import mongoose from "mongoose";

// Define extended Request type that includes user property
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

const callAIModel = async (messages: any[]): Promise<string> => {
  try {
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
          // model: "deepseek/deepseek-r1:free",
          // model: "openai/gpt-4.1-nano",
          model: "meta-llama/llama-4-maverick:free",
          messages,
        }),
      }
    );

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    // ✅ Add check and log full response
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

// Create a new chat
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

    const newChat = {
      _id: new mongoose.Types.ObjectId(), // Generate a unique ID
      title,
      messages: [
        {
          role: "assistant" as const,
          content:
            "You are TravelPal, a travel assistant. How can I help you today?",

          timestamp: new Date(),
        },
      ],
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

// Send message to chat
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

    // Call AI model
    const aiResponse = await callAIModel(aiMessages);

    // Add AI response
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

//EDIT

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

    console.log("Chat history:", chatHistory);
    console.log("Incoming chatId:", chatId);
    console.log(
      "Available chat IDs:",
      chatHistory.chats.map((chat) => chat._id.toString())
    );

    const chat = chatHistory.chats.find(
      (chat) => chat._id.toString() === chatId
    );

    console.log("Chat:", chat);
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
