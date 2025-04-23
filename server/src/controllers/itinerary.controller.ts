import { Request, Response, NextFunction, RequestHandler } from "express";
import Itinerary from "../models/Itinerary";
import ChatHistory from "../models/ChatHistory";

import fetch from "node-fetch";
import { sampleTemplate } from "../utils/template";

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
      // preferences,
    } = req.body;

    // Check if chat exists
    const chatHistory = await ChatHistory.findOne({ userId });
    if (!chatHistory) {
      res.status(404).json({ message: "Chat history not found" });
      return;
    }

    // console.log("Chat history:", chatHistory);
    // console.log("Raw:", rawResponse);

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
               
                  Use the following format for the itinerary:
                

                  /Header Section/
                  Add a Good quote related to travel 
                  *****Your Detailed [Destination] Travel Itinerary*****  
                  ***(4 Days(or the days Mentionartion) | [Style like Budget-Friendly, Adventure-Focused, etc.])* 
                  Add a Good quote related to travel 

                  ---

                  /Travel Guide Section/
              
                  $$Time to visit:
                    -Point1
                    -Point2
                    -Point3 
                  $$how to reach:
                    -Point1
                    -Point2
                    -Point3
                  $$places to visit: 
                    -Point1
                    -Point2
                    -Point3
                  $$things to do:
                    -Point1
                    -Point2
                    -Point3
                  $$where to stay:
                    -Point1
                    -Point2
                    -Point3 
                  $$where to eat:
                    -Point1
                    -Point2
                    -Point3

                  $$travel Tips:
                    -Point1
                    -Point2
                    -Point3

                  ---


                  /Itinerary Section/
                  ### **Day 1: [Theme like Arrival & Local Immersion]**  
                  **Morning (8:00 AM – 12:00 PM)**  
                  - **8:00 AM**: [Activity Name] – [Short description]  
                  - **9:30 AM**: [Breakfast spot with estimated cost]  
                  ...

                  Repeat for **Afternoon**, **Evening**.

                  ---

                  /Higlights Section/
                  Include:
                  - A final section:
                    - Budget Breakdown
                       --Point1
                       --Point2
                       --Point3
                    - Transportation tips
                       --Point1
                       --Point2
                       --Point3
                    - Local etiquette
                       --Point1
                       --Point2
                       --Point3 
                    - Hidden gems
                       --Point1
                       --Point2
                       --Point3
                    - Safety tips
                       --Point1
                       --Point2
                       --Point3

                  ---

                  Return the entire result in the below Example Template Fromat directly for display or PDF.
                  Also Add each section Name in **bold** and the content in *italics*.
                  Section Names shoul always Start with $$$

                  Example Tempelate: ${sampleTemplate}  

                  Strictly follow the example template format and do not add any extra information or code blocks.
                  

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

    let tags: string[] = [];
    try {
      // Create a system prompt for tag extraction
      const systemPrompt = `
              You are a travel itinerary tag extractor. Your task is to analyze the travel itinerary text and extract 5-6 relevant tags that best describe the itinerary.

              Examples of good tags include:
              - Travel styles (Adventure, Luxury, Budget, Family-friendly, Solo travel, etc.)
              - Main activities (Hiking, Beach, Sightseeing, Museums, Food tour, etc.)
              - Geographical features (Mountain, Coastal, Urban, Rural, etc.)
              - Cultural aspects (Historical, Religious, Art, Music, etc.)
              - Season or climate (Summer, Winter, Tropical, etc.)

              Extract ONLY 5-6 of the most relevant tags that appear in the text. Return ONLY an array of strings in JSON format.

              Example output format:
              ["Adventure", "Hiking", "Mountain", "Budget-friendly", "Summer", "Cultural"]
              `;

      // Use the existing callAIModel function instead of a direct fetch call
      const tagContent = await callAIModel([
        { role: "system", content: systemPrompt },
        { role: "user", content: aiResponse },
      ]);

      if (tagContent) {
        try {
          // Try to parse the JSON response
          if (tagContent.trim().startsWith("{")) {
            const jsonData = JSON.parse(tagContent);
            tags = jsonData.tags || [];
          } else {
            // Try to extract array pattern
            const match = tagContent.match(/\[(.*)\]/s);
            if (match) {
              tags = JSON.parse(`[${match[1]}]`);
            } else {
              // Fallback to splitting by commas
              tags = tagContent
                .replace(/["\[\]{}]/g, "")
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0);
            }
          }

          // Ensure we have strings and limit to 6 tags
          tags = Array.isArray(tags)
            ? tags
                .map((tag) => (typeof tag === "string" ? tag : String(tag)))
                .slice(0, 6)
            : [];

          console.log("Extracted tags:", tags);
        } catch (error) {
          console.error("Error parsing tags:", error);

          // Fallback approach
          tags = tagContent
            .replace(/["\[\]{}]/g, "")
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
            .slice(0, 6);
        }
      }
    } catch (error) {
      console.error("Error extracting tags:", error);
      // Continue with empty tags if extraction fails
    }

    // Create itinerary with tags
    const itinerary = new Itinerary({
      userId,
      chatId,
      title,
      rawResponse: aiResponse,
      destination,
      startDate: start,
      endDate: end,
      days,
      tags, // Include the extracted tags
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

// Update itinerary with tags
export const updateItineraryWithTags: RequestHandler = async (
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

    // Extract tags from the itinerary's raw response
    let tags: string[] = [];
    try {
      const systemPrompt = `
You are a travel itinerary tag extractor. Your task is to analyze the travel itinerary text and extract 5-6 relevant tags that best describe the itinerary.

Examples of good tags include:
- Travel styles (Adventure, Luxury, Budget, Family-friendly, Solo travel, etc.)
- Main activities (Hiking, Beach, Sightseeing, Museums, Food tour, etc.)
- Geographical features (Mountain, Coastal, Urban, Rural, etc.)
- Cultural aspects (Historical, Religious, Art, Music, etc.)
- Season or climate (Summer, Winter, Tropical, etc.)

Extract ONLY 5-6 of the most relevant tags that appear in the text. Return ONLY an array of strings in JSON format.

Example output format:
["Adventure", "Hiking", "Mountain", "Budget-friendly", "Summer", "Cultural"]
`;

      // Use the existing callAIModel function
      const tagContent = await callAIModel([
        { role: "system", content: systemPrompt },
        { role: "user", content: itinerary.rawResponse },
      ]);

      if (tagContent) {
        try {
          // Try to parse the JSON response
          if (tagContent.trim().startsWith("{")) {
            const jsonData = JSON.parse(tagContent);
            tags = jsonData.tags || [];
          } else {
            // Try to extract array pattern
            const match = tagContent.match(/\[(.*)\]/s);
            if (match) {
              tags = JSON.parse(`[${match[1]}]`);
            } else {
              // Fallback to splitting by commas
              tags = tagContent
                .replace(/["\[\]{}]/g, "")
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0);
            }
          }

          // Ensure we have strings and limit to 6 tags
          tags = Array.isArray(tags)
            ? tags
                .map((tag) => (typeof tag === "string" ? tag : String(tag)))
                .slice(0, 6)
            : [];

          console.log("Extracted tags:", tags);
        } catch (error) {
          console.error("Error parsing tags:", error);

          // Fallback approach
          tags = tagContent
            .replace(/["\[\]{}]/g, "")
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
            .slice(0, 6);
        }
      }

      // Update the itinerary with the new tags
      itinerary.tags = tags;
      await itinerary.save();

      res.json({
        message: "Itinerary tags updated successfully",
        itinerary,
      });
    } catch (error) {
      console.error("Tag extraction error:", error);
      res.status(500).json({ message: "Failed to extract tags" });
    }
  } catch (error) {
    console.error("Update itinerary tags error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//Delete itinerary
export const deleteItinerary: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const itinerary = await Itinerary.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!itinerary) {
      res.status(404).json({ message: "Itinerary not found" });
      return;
    }

    res.json({ message: "Itinerary deleted successfully" });
  } catch (error) {
    console.error("Delete itinerary error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
