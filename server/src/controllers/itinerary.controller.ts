import { Request, Response, NextFunction, RequestHandler } from "express";
import Itinerary from "../models/Itinerary";
import ChatHistory from "../models/ChatHistory";
import router from "../routes/auth.routes";
import { parseConversationToItinerary } from "../utils/itineraryParser";
import fetch from "node-fetch";

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
          model: "openai/gpt-4.1-nano",
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

// Create itinerary from chat
export const createItinerary: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const {
      chatId,
      title,
      destination,
      rawResponse,
      startDate,
      endDate,
      preferences,
    } = req.body;

    // Check if chat exists
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

    const intineryMessages = `Based on the following conversation, 
                  create a travel itinerary for ${destination} from ${startDate} to ${endDate}. 
                  Include activities, places to visit, and any other relevant information. Here are the details: ${rawResponse}
                  generate a detailed travel itinerary. Format it cleanly for PDF output, without code blocks or markdown.
                  Itineries should be in the following format: Time to visit, how to reach, places to visit, things to do, where to stay, where to eat, travel Tips
                  Then Add Day wise itinerary with the following format:
                  title: Day wise
                
                  Day 1: Date, Activities
                  Day 2: Date, Activities
                  Day 3: Date, Activities
                  Day 4: Date, Activities
                  etc
                  Use the following format for the itinerary:
                


                  **Your Detailed [Destination] Travel Itinerary**  
                  *(4 Days | [Style like Budget-Friendly, Adventure-Focused, etc.])*  

                  ---

                  ### **Day 1: [Theme like Arrival & Local Immersion]**  
                  **Morning (8:00 AM – 12:00 PM)**  
                  - **8:00 AM**: [Activity Name] – [Short description]  
                  - **9:30 AM**: [Breakfast spot with estimated cost]  
                  ...

                  Repeat for **Afternoon**, **Evening**.

                  ---

                  Include:
                  - Daily activities with **timestamps, names, locations, type**
                  - Local recommendations with **cost estimates (₹)**
                  - **Food & café suggestions**, hostels, adventure spots
                  - A final section:
                    - Budget Breakdown
                    - Transportation tips
                    - Local etiquette
                    - Hidden gems

                  Return the entire result in **clean markdown** (no code blocks or backticks) so it can be parsed directly for display or PDF.

                  Example destination: Manali  
                  Style: Budget-Friendly & Adventure-Focused

                  `;

    const aiResponse = await callAIModel([
      {
        role: "user",
        content: intineryMessages,
      },
    ]);
    if (!aiResponse) {
      res.status(500).json({ message: "Failed to get AI response" });
      return;
    }

    // Generate itinerary days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayDiff =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const days: { date: Date; activities: any[] }[] = [];
    for (let i = 0; i < dayDiff; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      days.push({
        date,
        activities: [],
      });
    }

    // Create itinerary
    const itinerary = new Itinerary({
      userId,
      chatId,
      title,
      rawResponse: aiResponse,
      destination,
      startDate: start,
      endDate: end,
      preferences,
      days,
    });

    await itinerary.save();

    res.status(201).json({
      message: "Itinerary created successfully",
      itinerary,
    });
  } catch (error) {
    console.error("Create itinerary error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user itineraries
export const getItineraries: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;

    const itineraries = await Itinerary.find({ userId }).sort({
      createdAt: -1,
    });

    res.json({ itineraries });
  } catch (error) {
    console.error("Get itineraries error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get itinerary by ID
export const getItineraryById: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const itinerary = await Itinerary.findOne({ _id: id, userId });

    if (!itinerary) {
      res.status(404).json({ message: "Itinerary not found" });
      return;
    }

    res.json({ itinerary });
  } catch (error) {
    console.error("Get itinerary error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update itinerary
export const updateItinerary: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const updates = req.body;

    const itinerary = await Itinerary.findOneAndUpdate(
      { _id: id, userId },
      updates,
      { new: true }
    );

    if (!itinerary) {
      res.status(404).json({ message: "Itinerary not found" });
      return;
    }

    res.json({
      message: "Itinerary updated successfully",
      itinerary,
    });
  } catch (error) {
    console.error("Update itinerary error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const itineraryCreate: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { chatId, message, conversation } = req.body;

    const parsed = parseConversationToItinerary(
      conversation,
      message,
      userId,
      chatId
    );

    if (!parsed) {
      res.status(400).json({
        success: false,
        error: "Unable to parse itinerary from the given messages.",
      });
      return;
    }

    parsed.rawResponse = message.content;

    const itinerary = await Itinerary.create(parsed);
    res.status(201).json({ success: true, itinerary });
  } catch (error) {
    console.error("Create itinerary error:", error);
    res.status(500).json({ success: false, error });
  }
};

router.get("/itinerary", async (req: Request, res: Response) => {
  const { userId } = req.query;
  const itineraries = await Itinerary.find({ userId });
  res.status(200).json({ success: true, itineraries }); // rawResponse will be included
});

export const itineraryGet: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const itinerary = await Itinerary.findOne({ _id: id, userId });

    if (!itinerary) {
      res.status(404).json({ message: "Itinerary not found" });
      return;
    }

    res.json({ itinerary });
  } catch (error) {
    console.error("Get itinerary error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
