import {
  emitNewMessageToChat,
  emitLastMessageToParticipants,
  emitChatAI,
} from "../lib/socket";
import mongoose from "mongoose";
import Chat from "../models/chat.model";
import User from "../models/user.model";
import { Env } from "../config/env.config";
import { ModelMessage, streamText } from "ai";
import Message from "../models/message.model";
import cloudinary from "../config/cloudinay.config";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { BadRequestException, NotFoundException } from "../utils/appError";

const google = createGoogleGenerativeAI({
  apiKey: Env.GOOGLE_API_KEY,
});

export const sendMessageservice = async (
  userId: string,
  body: {
    chatId: string;
    content?: string;
    image?: string;
    replyToId?: string;
  },
) => {
  const { chatId, content, image, replyToId } = body;

  const chat = await Chat.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  });

  if (!chat) {
    throw new BadRequestException("Chat not found or unauthorized");
  }

  if (replyToId) {
    const replyMessage = await Message.findOne({
      _id: replyToId,
      chatId,
    });
    if (!replyMessage) {
      throw new NotFoundException("Reply to message not found");
    }
  }

  let imageUrl;

  if (image) {
    // upload image to cloudinary
    const uploadRes = await cloudinary.uploader.upload(image);
    imageUrl = uploadRes.secure_url;
  }

  const newMessage = await Message.create({
    chatId,
    sender: userId,
    content,
    image: imageUrl,
    replyTo: replyToId || null,
  });

  await newMessage.populate([
    {
      path: "sender",
      select: "name avatar",
    },
    {
      path: "replyTo",
      select: "content image sender",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    },
  ]);

  chat.lastMessage = newMessage._id as mongoose.Types.ObjectId;
  await chat.save();

  // web socket emit new message to the chat
  emitNewMessageToChat(userId, chatId, newMessage);

  // web socket emit last message to members (personal chat)
  const allParticipantIds = chat.participants.map((id) => id.toString());
  emitLastMessageToParticipants(allParticipantIds, chatId, newMessage);

  let aiResponse: any = null;

  if (chat.isAiChat) {
    aiResponse = await getAIResponse(userId, chatId);
  }
  if (aiResponse) {
    chat.lastMessage = aiResponse._id as mongoose.Types.ObjectId;
    await chat.save();
  }

  return { userMessage: newMessage, chat, aiResponse, isAiChat: chat.isAiChat };
};

async function getAIResponse(userId: string, chatId: string) {
  const whopAI = await User.findOne({ isAI: true });
  if (!whopAI) throw new NotFoundException("AI user not found");

  const chatHistory = await getChatHistory(chatId);
  const formattedMessages: ModelMessage[] = chatHistory.map((msg: any) => {
    const role = msg.sender.isAI ? "assistant" : "user";
    const parts: any[] = [];

    if (msg.image) {
      parts.push({
        type: "file",
        data: msg.image,
        mediaType: "image/png",
        fileName: "image.png",
      });
      if (!msg.content) {
        parts.push({
          type: "text",
          text: "Describe what you see in the image",
        });
      }
    }
    if (msg.content) {
      parts.push({
        type: "text",
        text: msg.replyTo
          ? `[Replying to ${msg.replyTo.content}]\n${msg.content}`
          : msg.content,
      });
    }
    return {
      role,
      content: parts,
    };
  });

  const result = await streamText({
    model: google("gemini-2.5-flash"),
    messages: formattedMessages,
    system:
      "You are Talk Bridge AI, a helpful and friendly assistant. Respond only with text and attend to the last user message only.",
  });

  let fullResponse = "";
  for await (const chunk of result.textStream) {
    emitChatAI({
      chatId,
      chunk,
      sender: whopAI,
      done: false,
      message: null,
    });
    fullResponse += chunk;
  }
  if (!fullResponse.trim()) return "";

  const aiMessage = await Message.create({
    chatId,
    sender: whopAI._id,
    content: fullResponse,
  });

  await aiMessage.populate("sender", "name avatar isAI");

  // emit ai response to the chat
  emitChatAI({
    chatId,
    chunk: null,
    sender: whopAI,
    done: true,
    message: aiMessage,
  });

  emitLastMessageToParticipants([userId], chatId, aiMessage);

  return aiMessage;
}

async function getChatHistory(chatId: string) {
  const messages = await Message.find({ chatId })
    .populate("sender", "isAI")
    .populate("replyTo", "content")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return messages.reverse();
}
