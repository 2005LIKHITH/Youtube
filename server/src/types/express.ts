

import { IUser } from "../models/user.model";  // Import IUser (or User) model

declare global {
  namespace Express {
    interface Request {
      user?: IUser;  // Extend the Request interface to include 'user'
    }
  }
}
