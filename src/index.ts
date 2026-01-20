import "dotenv/config";
import cors from "cors";
import http from "http";
import path from "path";
import routes from "./routes";
import passport from "passport";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { Env } from "./config/env.config";
import { initializeSocket } from "./lib/socket";
import { HTTPSTATUS } from "./config/http.config";
import express, { Request, Response } from "express";
import connectToDatabase from "./config/database.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { errorHandler } from "./middlewares/errorHandler.middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

initializeSocket(server);

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
  }),
);

app.use("/api", routes);

if (Env.NODE_ENV === "production") {
  const clientPath = path.resolve(__dirname, "../../frontend/dist");

  // Serve static files
  app.use(express.static(clientPath));

  app.get(/^(?!\/api).*/, (req: Request, res: Response) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

app.use(errorHandler);

server.listen(PORT, async () => {
  console.log(
    `Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`,
  );
  await connectToDatabase();
});
