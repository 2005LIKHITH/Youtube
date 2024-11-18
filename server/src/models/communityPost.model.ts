import mongoose,{Schema,Document,Model, mongo} from "mongoose";

export interface ICommunityPost extends Document{
    owner : mongoose.Schema.Types.ObjectId,
    content : string,
    createdAt : Date,
    updatedAt : Date
}

const communityPostSchema = new Schema<ICommunityPost>({
    owner:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    content:{type:String,required:true},
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now}
},{timestamps:true})

export const CommunityPost:Model<ICommunityPost> = mongoose.model<ICommunityPost>("CommunityPost",communityPostSchema);