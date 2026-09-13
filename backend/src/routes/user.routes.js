import { Router } from "express";
import {
  createUser,
  getUser,
  logInUser,
  logOutUser,
} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/user.middleware.js";

const router = Router();

router.route("/register").post(createUser);
router.route("/login").post(logInUser);
router.route("/logout").post(verifyJwt, logOutUser);
router.route("/profile").get(verifyJwt, getUser);

export default router;
