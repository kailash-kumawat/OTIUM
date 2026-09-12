import jwt from "jsonwebtoken";
import { config } from "../config/env.config.js";
import {
  ApiError,
  generateAccessAndRefreshTokens,
  hashToken,
} from "../utils/index.js";
import prisma from "../db/index.js";

export const refreshAccessToken = async (incomingRefreshToken) => {
  const decoded = jwt.verify(incomingRefreshToken, config.refreshTokenSecret);

  const hashedRefreshToken = hashToken(incomingRefreshToken);

  const session = await prisma.session.findFirst({
    where: {
      userId: decoded.id,
      refresh_token: hashedRefreshToken,
      revoked_at: null,
    },
  });

  if (!session) {
    throw new ApiError(401, "Invalid or expired session — please log in again");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: decoded.id,
    },
    select: {
      id: true,
      email: true,
    },
  });

  const { accessToken, refreshToken: newRefreshToken } =
    generateAccessAndRefreshTokens(user);

  await prisma.session.update({
    where: {
      id: session.id,
    },
    data: {
      revoked_at: new Date(),
    },
  });

  await prisma.session.create({
    data: {
      userId: user.id,
      refresh_token: hashToken(newRefreshToken),
      expired_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
};
