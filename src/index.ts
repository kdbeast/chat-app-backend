import "dotenv/config";
import cors from "cors";
import passport from "passport";
import cookieParser from "cookie-parser";
import { Env } from "./config/env.config";
import routes from "./routes";
import { HTTPSTATUS } from "./config/http.config";
import express, { Request, Response } from "express";
import connectToDatabase from "./config/database.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { errorHandler } from "./middlewares/errorHandler.middleware";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: Env.FRONTEND_ORIGIN }));
app.use(passport.initialize());

app.get(
  "/health",
  asyncHandler(async (req: Request, res: Response) => {
    res
      .status(HTTPSTATUS.OK)
      .json({ message: "Server is healthy", status: "OK" });
  })
);

app.use("/api", routes);
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(
    `Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`
  );
  await connectToDatabase();
});

export default app;
