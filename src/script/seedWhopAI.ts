import "dotenv/config";
import UserModel from "../models/user.model";
import connectToDatabase from "../config/database.config";

export const CreateWhopAI = async () => {
  let whopAI = await UserModel.findOne({
    isAI: true,
  });
  if (whopAI) {
    console.log("✅ WhopAI already exists");
    return whopAI;
  }
  whopAI = await UserModel.create({
    name: "WhopAI",
    isAI: true,
    avatar: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
  });
  console.log("✅ WhopAI created", whopAI._id);
  return whopAI;
};

export const seedWhopAI = async () => {
  try {
    await connectToDatabase();
    await CreateWhopAI();
    console.log("✅ WhopAI seeded");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding WhopAI", error);
    process.exit(1);
  }
};

seedWhopAI();