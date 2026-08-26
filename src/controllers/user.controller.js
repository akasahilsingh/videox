import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../model/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
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
  console.log(coverImageOnCloudinary)
  const user = await User.create({
    userName: userName.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatarOnCloudinary.url,
    coverImage: coverImageOnCloudinary?.url || "",
  });

  res
    .status(201)
    .json(new ApiResponse(201, user, "User successfully registered"));
});

export { registerUser };
