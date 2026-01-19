import mongoose, { Schema, model, Document } from "mongoose";
import User from "./user.model";

interface ChatDocument extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage: mongoose.Types.ObjectId;
  isGroup: boolean;
  groupName?: string;
  isAiChat: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<ChatDocument>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: [
      {
        type: Schema.Types.ObjectId,
        ref: "Message",
        default: null,
      },
    ],
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      default: null,
    },
    isAiChat: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

chatSchema.pre("save", async function (next) {
  if (this.isNew) {
    const user = mongoose.model("User");
    const participants = await User.find({
      _id: {
        $in: this.participants,
        isAI: true,
      },
    });
    if (participants.length > 0) {
      this.isAiChat = true;
    }
  }
  next();
});

const Chat = model<ChatDocument>("Chat", chatSchema);

export default Chat;
