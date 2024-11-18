import mongoose, { Schema, Document, Model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


export interface IComment extends Document {
  videoId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  commentId: mongoose.Schema.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}


const commentSchema = new Schema<IComment>(
  {
    videoId: { type: mongoose.Types.ObjectId, ref: "Video", required: true},
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    commentId: { type: mongoose.Types.ObjectId, ref: "Comment",default: null },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);


commentSchema.plugin(mongooseAggregatePaginate);


export const Comment: Model<IComment> = mongoose.model<IComment>("Comment", commentSchema);
