import mongoose,{Schema,Document,Model} from "mongoose";

export interface ISubscriptionModel extends Document {
    subscriber : mongoose.Schema.Types.ObjectId
    channel : mongoose.Schema.Types.ObjectId
    createdAt : Date
    updatedAt : Date
}

const subscritptionSchema = new Schema<ISubscriptionModel>({
    subscriber:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    channel:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true}
},{timestamps:true})

export const Subscription:Model<ISubscriptionModel> = mongoose.model<ISubscriptionModel>("Subscription",subscritptionSchema);