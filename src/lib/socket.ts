import jwt from "jsonwebtoken";
import { Env } from "../config/env.config";
import { Server as HTTPServer } from "http";
import { Server, type Socket } from "socket.io";
import { validateChatParticipant } from "../services/chat.service";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let onlineUsers = new Map<string, string>();

let io: Server | null = null;
export const initializeSocket = (httpServer: HTTPServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: Env.FRONTEND_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) return next(new Error("Unauthorized"));

      const token = rawCookie?.split("=")?.[1]?.trim();
      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, Env.JWT_SECRET) as { userId: string };
      if (!decoded) return next(new Error("Unauthorized"));

      socket.userId = decoded.userId;

      next();
    } catch (error) {
      next(new Error("Internal server error"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    if (!socket.userId) {
      socket.disconnect(true);
      return;
    }

    const userId = socket.userId!;
    const newSocketId = socket.id;

    console.log("Socket connected:", { userId, newSocketId });

    // register socket for the user
    onlineUsers.set(userId, newSocketId);

    // Broadcast online users to all sockets
    io?.emit("onlineUsers", Array.from(onlineUsers.keys()));

    // create personal room for the user
    socket.join(`userId:${userId}`);

    socket.on(
      "chat:join",
      async (chatId: string, callback?: (err?: string) => void) => {
        try {
          await validateChatParticipant(chatId, userId);
          socket.join(`chatId:${chatId}`);
          console.log(`User${userId} joined chat ${chatId}`);
          callback?.();
        } catch (error) {
          callback?.("Error joining chat");
        }
      },
    );

    socket.on("chat:leave", (chatId: string) => {
      if (chatId) {
        socket.leave(`chatId:${chatId}`);
        console.log(`User${userId} left chat ${chatId}`);
      }
    });

    socket.on("disconnect", () => {
      if (onlineUsers.get(userId) === newSocketId) {
        if (userId) onlineUsers.delete(userId);
        io?.emit("onlineUsers", Array.from(onlineUsers.keys()));

        console.log("Socket disconnected:", { userId, newSocketId });
      }
    });
  });
};

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

export const emitNewChatToParticipants = (
  participantIds: string[] = [],
  chat: any,
) => {
  const io = getIO();
  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("newChat", chat);
  }
};

export const emitNewMessageToChat = (
  senderId: string, // userId that sent the message
  chatId: string,
  message: any,
) => {
  const io = getIO();
  const senderSocketId = onlineUsers.get(senderId.toString());

  if (senderSocketId) {
    io.to(senderSocketId).except(senderSocketId).emit("message:new", message);
  } else {
    io.to(`chatId:${chatId}`).emit("message:new", message);
  }
};

export const emitLastMessageToParticipants = (
  participantIds: string[] = [],
  chatId: string,
  message: any,
) => {
  const io = getIO();
  const payload = { chatId, message };

  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:update", payload);
  }
};

export const emitChatAI = ({
  chatId,
  chunk,
  sender,
  done,
  message,
}: {
  chatId: string;
  chunk: string | null;
  sender: any;
  done: boolean;
  message: any;
}) => {
  const io = getIO();
  if (chunk?.trim() && !done) {
    io.to(`chat:${chatId}`).emit("chat:ai", {
      chatId,
      chunk,
      sender,
      done: false,
      message: null,
    });
    return;
  }

  if (done) {
    io.to(`chat:${chatId}`).emit("chat:ai", {
      chatId,
      chunk: null,
      sender,
      done,
      message,
    });
  }
};
