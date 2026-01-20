import User from "../models/user.model";

export const findByIdUserService = async (userId: string) => {
  return await User.findById(userId);
};

export const getUsersService = async (userId: any) => {
  const users = await User.find({ _id: { $ne: userId } })
    .select("-password")
    .sort({ isAI: -1, name: 1 });

  return users;
};
