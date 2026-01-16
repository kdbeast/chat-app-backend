import mongoose from "mongoose";
import Chat from "../models/chat.model";
import Message from "../models/message.model";
import cloudinary from "../config/cloudinay.config";
import { BadRequestException, NotFoundException } from "../utils/appError";
import {
  emitLastMessageToParticipants,
  emitNewMessageToChat,
} from "../lib/socket";

export const sendMessageservice = async (
  userId: string,
  body: {
    chatId: string;
    content?: string;
    image?: string;
    replyToId?: string;
  }
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

  return { userMessage: newMessage, chat };
};
