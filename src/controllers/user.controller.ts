import { Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { getUsersService } from "../services/user.service";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";

export const getUsersController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    console.log(userId);

    const users = await getUsersService(userId);

    return res
      .status(HTTPSTATUS.OK)
      .json({ message: "Users fetched successfully", users });
  }
);
