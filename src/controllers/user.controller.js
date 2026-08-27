import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../model/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    // throw new ApiError(500, "Error while genrating access and refresh tokens")
    console.log(error.message);
  }
};

const options = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
};

const registerUser = asyncHandler(async (req, res) => {
  const { userName, email, fullName, password } = req.body;
  //   console.log("Request: ", req.body);
  if (!userName || !email || !fullName || !password) {
    throw new ApiError(400, "All fields are required to move forward");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const localAvatarPath = req.files?.avatar?.[0].path;
  console.log("AvatarPath : ", localAvatarPath);

  const localCoverImagePath = req.files?.coverImage?.[0].path;
  console.log("localCoverImagepath: ", localCoverImagePath);

  if (!localAvatarPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatarOnCloudinary = await uploadOnCloudinary(localAvatarPath);

  if (!avatarOnCloudinary) {
    throw new ApiError(500, "Unable to upload avatar");
  }

  const coverImageOnCloudinary = await uploadOnCloudinary(localCoverImagePath);
  console.log(coverImageOnCloudinary);
  const user = await User.create({
    userName: userName.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatarOnCloudinary.url,
    coverImage: coverImageOnCloudinary?.url || "",
  });

  const registeredUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  res
    .status(201)
    .json(new ApiResponse(201, registeredUser, "User successfully registered"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get email or userName and password
  // validate and check if available
  //check password if correct
  // generate access and refresh tokens
  // send in response with tokens
  // console.log("Req from client: ", req.body)
  const { email, password, userName } = req.body;

  if (!(email || userName) || !password) {
    throw new ApiError(400, "Provide all fields");
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  const authenticatedUser = await user.isPasswordCorrect(password);

  if (!authenticatedUser) {
    throw new ApiError(401, "Wrong credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { loggedInUser, accessToken, refreshToken },
        "Login successfull",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const { decoded } = req.user;
  await User.findOneAndUpdate(
    decoded?._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    },
  );

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new ApiError(401, error?.message || "Unable to verify token");
  }
  console.log("decoded: ", decoded);
  const user = await User.findById(decoded?._id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token expired or used");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user?._id);

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access Token Updated successfully",
      ),
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old and new passwords are required to continue");
  }

  if (oldPassword === newPassword) {
    throw new ApiError(400, "Old and new password must be different");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Password");
  }

  user.password = newPassword;
  user.refreshToken = undefined;

  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Password changed successfully. Login again"),
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
};
