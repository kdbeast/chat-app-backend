import User from "../models/user.model";

export const findByIdUserService = async (userId: string) => {
    return await User.findById(userId);
};