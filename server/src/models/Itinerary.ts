import mongoose, { Schema, Document } from "mongoose";

export interface IActivity {
  time: string;
  name: string;
  description: string;
  location?: string;
  type: "attraction" | "food" | "transport" | "accommodation" | "other";
}

export interface IDay {
  date: Date;
  activities: IActivity[];
}

export interface IItinerary extends Document {
  userId: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  tags: string[];
  days: IDay[];
  rawResponse: string; // Added field
  createdAt: Date;
  updatedAt: Date;
}

const ItinerarySchema: Schema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, required: true },
    chatId: { type: mongoose.Types.ObjectId, required: true },
    title: { type: String, required: true },
    destination: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    tags: { type: [String], default: [] },
    rawResponse: { type: String, required: true }, // Added field
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IItinerary>("Itinerary", ItinerarySchema);
