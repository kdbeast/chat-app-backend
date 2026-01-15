import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import { getUsersController } from "../controllers/user.controller";

const userRoutes = Router();

userRoutes.get("/all", passportAuthenticateJwt, getUsersController);

export default userRoutes;
