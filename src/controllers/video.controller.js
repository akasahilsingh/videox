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
  const videoLocalPath = req.files?.video?.[0].path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0].path;
 

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required to publish video");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required to publish video");
  }

  const video = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!video || !video.url) {
    throw new ApiError(500, "Unable to upload video on Cloudinary");
  }

  if (!thumbnail || !thumbnail.url) {
    throw new ApiError(500, "Unable to upload thumbnail on Cloudinary");
  }

  const uploadedVideo = await Video.create({
    videoFile: video.url,
    thumbnail: thumbnail.url,
    title: title,
    description: description,
    duration: video?.duration,
    isPublished: true,
    owner: req.user?._id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, { uploadedVideo }, "Video published successfully"));
});

export { getAllVideos, publishAVideo };
