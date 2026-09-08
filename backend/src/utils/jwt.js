import jwt from "jsonwebtoken";
import { config } from "../config/env.config.js";

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
