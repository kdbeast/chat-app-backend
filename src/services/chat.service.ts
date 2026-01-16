import Chat from "../models/chat.model";
import User from "../models/user.model";
import Message from "../models/message.model";
import { NotFoundException, BadRequestException } from "../utils/appError";

export const createChatService = async (
  userId: string,
  body: {
    participantId?: string;
    isGroup?: boolean;
    participants?: string[];
    groupName?: string;
  }
) => {
  const { participantId, isGroup, participants, groupName } = body;

  let chat;
  let allParticipantIds: string[] = [];

  if (isGroup && participants?.length && groupName) {
    allParticipantIds = [userId, ...participants];
    chat = await Chat.create({
      participants: allParticipantIds,
      isGroup: true,
      groupName,
      createdBy: userId,
    });
    chat = await chat.populate("participants", "name avatar");
  } else if (participantId) {
    const otherUser = await User.findById(participantId);

    if (!otherUser) {
      throw new NotFoundException("User not found");
    }

    allParticipantIds = [userId, participantId];

    const existingChat = await Chat.findOne({
      participants: { $all: allParticipantIds, $size: 2 },
    }).populate("participants", "name avatar");

    if (existingChat) return existingChat;

    chat = await Chat.create({
      participants: allParticipantIds,
      isGroup: false,
      createdBy: userId,
    });
    chat = await chat.populate("participants", "name avatar");
  }

  if (!chat) {
    throw new BadRequestException(
      "Invalid chat data. Provide participantId for single chat, or isGroup, participants, and groupName for group chat."
    );
  }

  return chat;
};

export const getUserChatsService = async (userId: string) => {
  return await Chat.find({ participants: { $in: [userId] } })
    .populate("participants", "name avatar")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    })
    .sort({ updatedAt: -1 });
};

export const getSingleChatService = async (userId: string, chatId: string) => {
  const chat = await Chat.findOne({
    _id: chatId,
    participants: { $in: [userId] },
  });

  if (!chat) {
    throw new NotFoundException(
      "Chat not found or you are not authorized to view this chat"
    );
  }

  const messages = await Message.find({ chatId })
    .populate("sender", "name avatar")
    .populate({
      path: "replyTo",
      select: "content image sender",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    })
    .sort({ createdAt: 1 });

  return { chat, messages };
};

export const validateChatParticipant = async (
  userId: string,
  chatId: string
) => {
  const chat = await Chat.findOne({
    _id: chatId,
    participants: { $in: [userId] },
  });

  if (!chat) {
    throw new BadRequestException("User not a participant of this chat");
  }

  return chat;
};
