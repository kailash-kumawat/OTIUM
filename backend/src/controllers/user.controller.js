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

export const logInUser = asyncHandler(async (req, res) => {
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
  } = await userService.logInUser({ email, password });

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .cookie("refreshToken", refreshToken, refreshTokenOptions)
    .json(new ApiResponse(200, loggedInUser, "logged in successfully"));
});

export const logOutUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const refreshToken = req.cookies.refreshToken;

  const options = await userService.logOutUser(userId, refreshToken);

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const getUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const userDetails = await userService.getUser(userId);

  return res
    .status(200)
    .json(
      new ApiResponse(200, userDetails, "User profile fetched successfully"),
    );
});

export const updateUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, email, dob, profession } = req.body;

  if (!name && !email && !dob && !profession) {
    throw new ApiError(400, "At least one field is required to update");
  }

  const updatedUser = await userService.updateUser(
    { name, email, dob, profession },
    userId,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

export const updateUserPassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both old and new passwords are required");
  }

  await userService.updateUserPassword({ oldPassword, newPassword }, userId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password updated successfully"));
});
