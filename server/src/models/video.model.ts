import mongoose,{Schema,Document,Types,Model} from "mongoose";
import  mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface IVideo{
    videoFile:string,
    thumbnail:string,
    description:string,
    title:string,
    duration:string,
    views:number,
    isPublished:boolean,
    owner:Types.ObjectId,
    createdAt:Date,
    updatedAt:Date
}

const videoSchema = new Schema<IVideo>({
    
    videoFile:{type:String,required:true},
    thumbnail:{type:String,required:true},
    description:{type:String,required:true},
    title:{type:String,required:true},
    duration:{type:String,required:true},
    views:{type:Number,required:true},
    isPublished:{type:Boolean,required:true},
    owner:{type:Schema.Types.ObjectId,ref:"User",required:true}
},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate);

export const Video:Model<IVideo> = mongoose.model<IVideo>("Video",videoSchema);