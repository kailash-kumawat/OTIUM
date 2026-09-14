import { asyncHandler, ApiError } from "../utils/index.js";
import jwt from "jsonwebtoken";
import prisma from "../db/index.js";
import { config } from "../config/env.config.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, config.accessTokenSecret);

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
    });

    if (!user) {
      throw new ApiError(
        401,
        "Your session has ended. Please log in again to continue.",
      );
    }

    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(
      401,
      "Your session has ended. Please log in again to continue.",
    );
  }
});
