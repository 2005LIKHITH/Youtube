import mongoose, { Schema, Types, Model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface IVideo {
    videoFile: string;
    thumbnail: string;
    description: string;
    title: string;
    duration: string;
    views: number;
    isPublished: boolean;
    owner: Types.ObjectId;
    comments: Types.ObjectId[];  // Added comments field
    createdAt: Date;
    updatedAt: Date;
}

const videoSchema = new Schema<IVideo>({
    videoFile: { type: String, required: true },
    thumbnail: { type: String, required: true },
    description: { type: String, required: true },
    title: { type: String, required: true },
    duration: { type: String, required: true },
    views: { type: Number, required: true },
    isPublished: { type: Boolean, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }]  // This is where comments are referenced
}, { timestamps: true });

videoSchema.plugin(mongooseAggregatePaginate);

export const Video: Model<IVideo> = mongoose.model<IVideo>("Video", videoSchema);
