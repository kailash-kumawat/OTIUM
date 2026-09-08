import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";
import * as userService from "../services/user.service.js";

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if ([name, email, password].some((field) => !field || field.trim === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const createdUser = await userService.createUser({
    name,
    email,
    password,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "Signed-up successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const {
    safeUser: loggedInUser,
    accessToken,
    refreshToken,
    accessTokenOptions,
    refreshTokenOptions,
  } = await userService.loginUser({ email, password });

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .cookie("refreshToken", refreshToken, refreshTokenOptions)
    .json(new ApiResponse(200, loggedInUser, "logged in successfully"));
});
