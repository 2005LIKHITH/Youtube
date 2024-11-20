import mongoose, { Schema, Model , Types} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface IComment {
  videoId?: Types.ObjectId;
  communityPostId?:Types.ObjectId;
  userId: Types.ObjectId;
  commentId?: Types.ObjectId;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const commentSchema = new Schema<IComment>(
  {
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", default: null },
    communityPostId: { type: mongoose.Schema.Types.ObjectId, ref: "CommunityPost", default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

commentSchema.path("videoId").validate(function () {
  return this.videoId || this.communityPostId || this.commentId;
}, "At least one of videoId, communityPostId, or commentId must be provided.");

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment: Model<IComment> = mongoose.model<IComment>("Comment", commentSchema);
