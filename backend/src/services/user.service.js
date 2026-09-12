import prisma from "../db/index.js";
import bcrypt from "bcrypt";
import {
  ApiError,
  generateAccessAndRefreshTokens,
  hashToken,
} from "../utils/index.js";
import { config } from "../config/env.config.js";

export const createUser = async ({ name, email, password }) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      email: email,
    },
    select: { id: true },
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      created_at: true,
    },
  });
};

export const logInUser = async ({ email, password }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, password: true },
  });

  if (!existingUser) {
    throw new ApiError(404, "User not found with this email");
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    existingUser.password,
  );

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid password");
  }

  const { password: _, ...safeUser } = existingUser;

  const { accessToken, refreshToken } =
    generateAccessAndRefreshTokens(safeUser);

  const expiresAtDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const hashedRefreshToken = hashToken(refreshToken);

  await prisma.session.create({
    data: {
      userId: safeUser.id,
      refresh_token: hashedRefreshToken,
      expired_at: expiresAtDate,
    },
  });

  const isProduction = config.nodeEnv === "production";

  const accessTokenOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 1000 * 60 * 15,
  };

  const refreshTokenOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };

  return {
    safeUser,
    accessToken,
    refreshToken,
    accessTokenOptions,
    refreshTokenOptions,
  };
};

export const logOutUser = async (userId, refreshToken) => {
  const hashedIncomingToken = hashToken(refreshToken);

  const session = await prisma.session.findFirst({
    where: {
      userId,
      refresh_token: hashedIncomingToken,
      revoked_at: null,
    },
  });

  if (!session) {
    throw new ApiError(400, "Session not found or already logged out");
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { revoked_at: new Date() },
  });

  const isProduction = config.nodeEnv === "production";

  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };

  return options;
};