import mongoose,{Schema,Document,Model,Types} from "mongoose";

export interface ILike extends Document{
    video:Types.ObjectId,
    comment:Types.ObjectId,
    likedBy:Types.ObjectId,
    communityPost:Types.ObjectId,
    createdAt:Date,
    updatedAt:Date
}

const likeSchema = new Schema<ILike>({
    video:{type:mongoose.Schema.Types.ObjectId,ref:"Video"},
    comment:{type:mongoose.Schema.Types.ObjectId,ref:"Comment"},
    likedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
    communityPost:{type:mongoose.Schema.Types.ObjectId,ref:"CommunityPost"},
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now}
},{timestamps:true})

export const Like:Model<ILike> = mongoose.model<ILike>("Like",likeSchema);