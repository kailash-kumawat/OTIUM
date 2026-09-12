import jwt from "jsonwebtoken";
import { config } from "../config/env.config.js";
import crypto from "crypto";

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateAccessAndRefreshTokens = (user) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    config.accessTokenSecret,
    { expiresIn: config.accessTokenExpiry },
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
    },
    config.refreshTokenSecret,
    { expiresIn: config.refreshTokenExpiry },
  );

  return { accessToken, refreshToken };
};
