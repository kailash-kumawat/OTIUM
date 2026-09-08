import prisma from "../db/index.js";
import bcrypt from "bcrypt";
import { ApiError, generateAccessAndRefreshTokens } from "../utils/index.js";
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

export const loginUser = async ({ email, password }) => {
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

  const expiresAtDate = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  );
  

  // CHECK: we have session schema for refresh token
  await prisma.session.create({
    data: {
      userId: safeUser.id,
      refresh_token: refreshToken,
      expired_at: expiresAtDate,
    },
  });

  const isProduction = config.nodeEnv === "production";

  const accessTokenOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 1000 * 60 * 15, // 15 minutes
  };

  const refreshTokenOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  };

  return {
    safeUser,
    accessToken,
    refreshToken,
    accessTokenOptions,
    refreshTokenOptions,
  };
};
