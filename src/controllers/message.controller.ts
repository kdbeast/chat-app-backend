import { Response, Request } from "express";
import { sendMessageservice } from "../services/message.service";
import { sendMessageSchema } from "../validators/message.validator";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";

export const sendMessageController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const body = sendMessageSchema.parse(req.body);

    const { userMessage, chat } = await sendMessageservice(userId, body);

    res.status(HTTPSTATUS.OK).json({
      message: "Message sent successfully",
      userMessage,
      chat,
    });
  }
);
