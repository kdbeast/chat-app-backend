import mongoose from "mongoose";
import { ENV } from "./env.config";

const connectToDatabase = async () => {
  try {
    await mongoose.connect(ENV.MONGODB_URI);
    console.log("Database connected");
  } catch (error) {
    console.log("Database connection error", error);
    process.exit(1);
  }
};

export default connectToDatabase;
