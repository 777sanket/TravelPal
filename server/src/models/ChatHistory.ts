// import mongoose, { Schema, Document } from "mongoose";

// export interface IMessage {
//   role: "user" | "assistant";
//   content: string;
//   timestamp: Date;
// }

// export interface IChat {
//   _id: any;
//   title: string;
//   messages: IMessage[];
// }

// export interface IChatHistory extends Document {
//   userId: mongoose.Types.ObjectId;
//   chats: IChat[];
// }

// const MessageSchema: Schema = new Schema({
//   role: { type: String, enum: ["user", "assistant"], required: true },
//   content: { type: String, required: true },
//   timestamp: { type: Date, default: Date.now },
// });

// const ChatSchema: Schema = new Schema({
//   title: { type: String, required: true },
//   messages: [MessageSchema],
// });

// const ChatHistorySchema: Schema = new Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     chats: [ChatSchema],
//   },
//   { timestamps: true }
// );

// export default mongoose.model<IChatHistory>("ChatHistory", ChatHistorySchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface IChat {
  _id: any;
  title: string;
  messages: IMessage[];
  structuredItinerary?: any; // Add this line
}

export interface IChatHistory extends Document {
  userId: mongoose.Types.ObjectId;
  chats: IChat[];
}

const MessageSchema: Schema = new Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ChatSchema: Schema = new Schema({
  title: { type: String, required: true },
  messages: [MessageSchema],
  structuredItinerary: { type: mongoose.Schema.Types.Mixed, default: null }, // Add this line
});

const ChatHistorySchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chats: [ChatSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IChatHistory>("ChatHistory", ChatHistorySchema);
