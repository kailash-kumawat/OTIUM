import prisma from "../db/index.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  ApiError,
  generateAccessAndRefreshTokens,
  hashToken,
  sendPasswordResetEmail,
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

  // TODO: Move below options to controller.
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

export const getUser = async (userId) => {
  return await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      name: true,
      email: true,
      preference: true,
      dob: true,
      profession: true,
    },
  });
};

export const updateUser = async ({ name, email, dob, profession }, userId) => {
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name,
      email,
      dob,
      profession,
    },
    select: {
      id: true,
      name: true,
      email: true,
      dob: true,
      profession: true,
    },
  });
};

export const updateUserPassword = async (
  { oldPassword, newPassword },
  userId,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

  if (!isOldPasswordCorrect) {
    throw new ApiError(401, "Old password is incorrect");
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  return await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedNewPassword,
    },
    select: { id: true },
  });
};

export const resetPasswordLink = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return "if that email exists, we've sent a reset link";
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  const resetLink = `${config.frontendUrl}/reset-password?token=${rawToken}&email=${user.email}`;
  await sendPasswordResetEmail(user.email, resetLink);
};

export const resetPassword = async (token, email, newPassword) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(400, "Invalid or expired reset link");
  }

  const tokenHash = hashToken(token);

  const resetRecord = await prisma.passwordReset.findFirst({
    where: {
      userId: user.id,
      token_hash: tokenHash,
      used_at: null,
      expires_at: { gt: new Date() },
    },
  });

  if (!resetRecord) {
    throw new ApiError(400, "Invalid or expired reset link");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used_at: new Date() },
    }),

    prisma.session.updateMany({
      where: { userId: user.id, revoked_at: null },
      data: { revoked_at: new Date() },
    }),
  ]);
};
