import User from "../models/user.model";
import {
    LoginSchemaType,
    RegisterSchemaType,
} from "../validators/auth.validator";
import { NotFoundException, UnauthorizedException } from "../utils/appError";

export const registerService = async (body: RegisterSchemaType) => {
  const { email } = body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new UnauthorizedException("User already exists");

  const newUser = new User({
    name: body.name,
    email: body.email,
    password: body.password,
    avatar: body.avatar,
  });
  await newUser.save();
  return newUser;
};

export const loginService = async (body: LoginSchemaType) => {
  const { email, password } = body;

  const user = await User.findOne({ email });
  if (!user) throw new NotFoundException("User not found");

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid)
    throw new UnauthorizedException("Invalid email or password");

  return user;
};
