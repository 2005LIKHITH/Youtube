import mongoose, { Schema, Document, Model , Types} from "mongoose";

export interface ICommunityPost extends Document {
    owner: Types.ObjectId;
    content: string;
    comments: Types.ObjectId[]; // Added comments field
    createdAt: Date;
    updatedAt: Date;
}

const communityPostSchema = new Schema<ICommunityPost>({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }], // Added comments array to reference the Comment model
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const CommunityPost: Model<ICommunityPost> = mongoose.model<ICommunityPost>("CommunityPost", communityPostSchema);
