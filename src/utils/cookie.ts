import jwt from "jsonwebtoken";
import { Response } from "express";
import { Env } from "../config/env.config";

type Time = `${number}${"s" | "h" | "m" | "d" | "w" | "y"}`;
type Cookie = {
  res: Response;
  userId: string;
};

export const setJwtAuthCookie = ({ res, userId }: Cookie) => {
  const payload = { userId };
  const expiresIn = Env.JWT_EXPIRES_IN as Time;
  const token = jwt.sign(payload, Env.JWT_SECRET, {
    audience: ["User"],
    expiresIn: expiresIn || "7d",
  });

  return res.cookie("accessToken", token, {
    httpOnly: true,
    secure: Env.NODE_ENV === "production" ? true : false,
    sameSite: Env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearJwtAuthCookie = (res: Response) => {
  return res.clearCookie("accessToken", { path: "/" });
};
