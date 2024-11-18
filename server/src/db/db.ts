import mongoose from "mongoose";
import {DB_NAME} from '../constants'



const connectDB = async (): Promise<void> => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MONGO DB connection error:", error);
        process.exit(1);
    }
};

export { connectDB };
