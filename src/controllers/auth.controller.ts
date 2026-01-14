import { Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { loginService } from "../services/auth.service";
import { registerService } from "../services/auth.service";
import { loginSchema } from "../validators/auth.validator";
import { registerSchema } from "../validators/auth.validator";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { setJwtAuthCookie, clearJwtAuthCookie } from "../utils/cookie";

export const registerController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = registerSchema.parse(req.body);

    const user = await registerService(body);
    const userId = user._id.toString();

    return setJwtAuthCookie({
      res,
      userId,
    })
      .status(HTTPSTATUS.CREATED)
      .json({
        message: "User registered successfully",
        user,
      });
  }
);

export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = loginSchema.parse(req.body);

    const user = await loginService(body);
    const userId = user._id.toString();

    return setJwtAuthCookie({
      res,
      userId,
    })
      .status(HTTPSTATUS.OK)
      .json({
        message: "User logged in successfully",
        user,
      });
  }
);

export const logoutController = asyncHandler(
  async (_: Request, res: Response) => {
    return clearJwtAuthCookie(res).status(HTTPSTATUS.OK).json({
      message: "User logged out successfully",
    });
  }
);

export const authStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    return res.status(HTTPSTATUS.OK).json({
      message: "Authenticated User",
      user,
    });
  }
);
