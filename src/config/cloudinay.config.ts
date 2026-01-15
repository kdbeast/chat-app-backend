import { Env } from "./env.config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: Env.CLOUDINARY_CLOUD_NAME,
  api_key: Env.CLOUDINARY_API_KEY,
  api_secret: Env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: "chatApp",
    });
    return response;
  } catch (error) {
    console.log(error);
    return null;
  }
};