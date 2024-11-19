// Import your IUser interface (which corresponds to the user model)
import { IUser } from "../models/user.model";  

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: IUser;  // Add the user property to the request object, which can be an IUser or undefined
    }
  }
}
