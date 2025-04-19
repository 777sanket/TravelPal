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
  preferences: {
    cuisines: string[];
    placeTypes: string[];
    specialRequirements: string[];
    otherInterests: string[];
  };
  days: IDay[];
  rawResponse: string; // Added field
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema: Schema = new Schema({
  time: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String },
  type: {
    type: String,
    enum: ["attraction", "food", "transport", "accommodation", "other"],
    required: true,
  },
});

const DaySchema: Schema = new Schema({
  date: { type: Date, required: true },
  activities: [ActivitySchema],
});

const ItinerarySchema: Schema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, required: true },
    chatId: { type: mongoose.Types.ObjectId, required: true },
    title: { type: String, required: true },
    destination: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    preferences: {
      cuisines: { type: [String], default: [] },
      placeTypes: { type: [String], default: [] },
      specialRequirements: { type: [String], default: [] },
      otherInterests: { type: [String], default: [] },
    },
    days: { type: [DaySchema], default: [] },

    rawResponse: { type: String, required: true }, // Added field
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IItinerary>("Itinerary", ItinerarySchema);
