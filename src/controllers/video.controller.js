import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { Video } from "../model/video.model.js";
import { User } from "../model/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!title.trim() || !description.trim()) {
    throw new ApiError(
      400,
      "Title and description is required to publish vidoe",
    );
  }

  const videoLocalPath = req.file?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required to publish video");
  }

  res
    .status(201)
    .json(new ApiResponse(201, {}, "Video published successfully"));
});

export { getAllVideos, publishAVideo };
