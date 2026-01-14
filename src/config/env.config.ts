import { getEnv } from "../utils/get_env";

export const ENV = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnv("PORT", "3000"),
  MONGODB_URI: getEnv("MONGO_URL", ""),
  JWT_SECRET: getEnv("JWT_SECRET", ""),
  JWT_EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "1d"),
  FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN", "http://localhost:5173"),
} as const;
