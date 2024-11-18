
import { IUser } from "../models/user.model";  // Import IUser (or User) model

declare module 'express' {
  export interface Request {
    user?: IUser;  
}
}