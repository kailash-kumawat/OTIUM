import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";
import * as tokenService from "../services/token.service.js";
import { config } from "../config/env.config.js";

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "No refresh token provided");
  }

  const { accessToken, refreshToken } =
    await tokenService.refreshAccessToken(incomingRefreshToken);

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

  return res
    .status(200)
    .cookies("refreshToken", refreshToken, refreshTokenOptions)
    .cookies("refreshToken", accessToken, accessTokenOptions)
    .json(new ApiResponse(200, "Access token refreshed successfully"));
});
