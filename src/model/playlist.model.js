import mongoose, { mongo, Schema } from "mongoose";

const playListSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videos: [
      {
        video: {
          type: Schema.Types.ObjectId,
          ref: "Video",
        },
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export const Playlist = mongoose.model("Playlist", playListSchema);
