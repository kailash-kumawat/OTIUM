import { Router } from "express";
import {
  createUser,
  getUser,
  logInUser,
  logOutUser,
  resetPassword,
  resetPasswordLink,
  updateUser,
  updateUserPassword,
} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/user.middleware.js";

const router = Router();

router.route("/register").post(createUser);
router.route("/login").post(logInUser);
router.route("/logout").post(verifyJwt, logOutUser);
router.route("/profile").get(verifyJwt, getUser).patch(verifyJwt, updateUser);
router.route("/password").put(verifyJwt, updateUserPassword);
router.route("/reset").post(resetPasswordLink);
router.route("/reset-password").put(resetPassword);

export default router;
