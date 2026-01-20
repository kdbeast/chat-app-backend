import "dotenv/config";
import User from "../models/user.model.js";
import connectToDatabase from "../config/database.config.js";

export const CreateWhopAI = async () => {
  const allAI = await User.find({ isAI: true });
  console.log("Total AI users in DB:", allAI.length);
  allAI.forEach((u) => console.log(`- ${u.name} (${u._id})`));

  let whopAI = await User.findOne({
    isAI: true,
  });

  const aiName = "TalkBridge AI";
  const aiAvatar =
    "https://cdn.dribbble.com/userupload/13217975/file/original-2babfe49663937e748fb666c80f266f5.jpg?resize=400x0";

  if (whopAI) {
    whopAI.name = aiName;
    whopAI.avatar = aiAvatar;
    await whopAI.save();
    console.log("✅ TalkBridge AI profile updated");
    return whopAI;
  }

  whopAI = await User.create({
    name: aiName,
    email: "ai@talkbridge.com",
    isAI: true,
    avatar: aiAvatar,
  });
  console.log("✅ TalkBridge AI created", whopAI._id);
  return whopAI;
};

export const seedWhopAI = async () => {
  try {
    await connectToDatabase();
    await CreateWhopAI();
    console.log("✅ TalkBridge AI seeded");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding TalkBridge AI", error);
    process.exit(1);
  }
};

seedWhopAI();
