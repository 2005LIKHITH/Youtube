import mongoose,{Schema,Document,Model} from "mongoose";

export interface IPlaylist extends Document{
    name:string;
    description:string;
    owner:mongoose.Schema.Types.ObjectId;
    videos:mongoose.Schema.Types.ObjectId[];
    createdAt:Date;
    updatedAt:Date;
}

const playlistSchema = new Schema<IPlaylist>({
    name:{type:String,required:true},
    description:{type:String,required:true},
    owner:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    videos:[{type:mongoose.Schema.Types.ObjectId,ref:"Video"}],

},{timestamps:true})

export const Playlist:Model<IPlaylist> = mongoose.model<IPlaylist>("Playlist",playlistSchema);