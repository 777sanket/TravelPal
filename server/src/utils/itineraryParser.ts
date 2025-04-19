import { IItinerary } from "../models/Itinerary";
import mongoose from "mongoose";

export const parseConversationToItinerary = (
  conversation: any[],
  message: any,
  userId: string,
  chatId: string
): Partial<IItinerary> | null => {
  if (!conversation || conversation.length === 0 || !message) return null;

  const itinerary: Partial<IItinerary> = {
    userId: new mongoose.Types.ObjectId(userId),
    chatId: new mongoose.Types.ObjectId(chatId),
    title: "Trip Itinerary",
    destination: "",
    startDate: new Date(),
    endDate: new Date(),
    preferences: {
      cuisines: [],
      placeTypes: [],
      specialRequirements: [],
      otherInterests: [],
    },
    days: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Parse from conversation history
  conversation.forEach((msg) => {
    const content = msg.content.toLowerCase();

    // if (
    //   content.includes("where would you like to travel") ||
    //   content.includes("destination")
    // ) {
    //   const next = conversation.find(
    //     (m) => m.timestamp > msg.timestamp && m.role === "user"
    //   );
    //   if (next) itinerary.destination = capitalize(next.content.trim());
    // }

    // More reliable destination detection
    if (!itinerary.destination) {
      const userDestinationMsg = conversation.find(
        (m) => m.role === "user" && /^[a-zA-Z\s]+$/.test(m.content.trim())
      );
      if (userDestinationMsg) {
        itinerary.destination = capitalize(userDestinationMsg.content.trim());
      }
    }

    if (content.includes("travel dates")) {
      const next = conversation.find(
        (m) => m.timestamp > msg.timestamp && m.role === "user"
      );
      if (next) {
        const match = next.content.match(
          /(\d{1,2}[a-z]{2}?\s*\w+\s*\d{4})\s*(to|-)\s*(\d{1,2}[a-z]{2}?\s*\w+\s*\d{4})/i
        );
        if (match) {
          itinerary.startDate = new Date(match[1]);
          itinerary.endDate = new Date(match[3]);
        }
      }
    }

    if (content.includes("cuisine") || content.includes("food")) {
      const next = conversation.find(
        (m) => m.timestamp > msg.timestamp && m.role === "user"
      );
      if (next)
        itinerary.preferences!.cuisines!.push(capitalize(next.content.trim()));
    }

    if (
      content.includes("interested in visiting") ||
      content.includes("places you like")
    ) {
      const next = conversation.find(
        (m) => m.timestamp > msg.timestamp && m.role === "user"
      );
      if (next)
        itinerary.preferences!.placeTypes!.push(
          ...next.content.split(",").map((c) => capitalize(c.trim()))
        );
    }

    if (msg.content.toLowerCase().includes("how to reach")) {
      itinerary.preferences!.specialRequirements!.push("Travel guidance");
    }

    if (msg.content.toLowerCase().includes("clothes")) {
      itinerary.preferences!.specialRequirements!.push("Packing tips");
    }
  });

  // Try parsing the assistant's final detailed itinerary message
  const activitiesByDay = extractActivitiesFromMessage(message.content);
  itinerary.days = activitiesByDay;

  return itinerary;
};

// Util to extract activities from structured message (very simple logic; can be extended with NLP)
const extractActivitiesFromMessage = (text: string) => {
  const days: any[] = [];
  const dayRegex = /##+\s*🗓️?\s*\*\*Day\s*(\d+):([^–]+)–\s*([^\n]+)\*\*/g;

  const blocks = [...text.matchAll(dayRegex)];
  blocks.forEach((match, idx) => {
    const [, dayNum, dayTitle, dateLabel] = match;
    const date = getDateFromDayOffset(idx); // fallback to offset-based days

    const activities = [];
    const blockStart = match.index!;
    const blockEnd = blocks[idx + 1]?.index || text.length;
    const dayText = text.slice(blockStart, blockEnd);

    const times = dayText.match(/(\*\*[^\n]+):\*\*\s*(.*)/g);
    if (times) {
      times.forEach((line) => {
        const [_, timePart, detail] = line.match(/\*\*(.+):\*\*\s*(.+)/) || [];
        activities.push({
          time: timePart || "Time not specified",
          name: detail.split(".")[0].slice(0, 50),
          description: detail,
          type: "other",
        });
      });
    }

    days.push({
      date,
      activities,
    });
  });

  return days;
};

// Utility to capitalize strings
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// Get date based on offset from start
const getDateFromDayOffset = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
};
