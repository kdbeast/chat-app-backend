import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ENV } from "./config/env.config";
import { HTTPSTATUS } from "./config/http.config";
import express, { Request, Response } from "express";
import connectToDatabase from "./config/database.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { errorHandler } from "./middlewares/errorHandler.middleware";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: ENV.FRONTEND_ORIGIN }));

app.get(
  "/health",
  asyncHandler(async (req: Request, res: Response) => {
    res
      .status(HTTPSTATUS.OK)
      .json({ message: "Server is healthy", status: "OK" });
  })
);

app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(
    `Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`
  );
  await connectToDatabase();
});

export default app;
