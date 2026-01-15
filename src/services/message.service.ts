import cloudinary from "../config/cloudinay.config";
import Chat from "../models/chat.model";
import Message from "../models/message.model";
import { BadRequestException, NotFoundException } from "../utils/appError";

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

  chat.lastMessage = newMessage._id as any;
  await chat.save();

  return { userMessage: newMessage, chat };
};
