// Import your IUser interface (which corresponds to the user model)
import { IUser } from "../models/user.model";  

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
      interface User {
          _id: string;
          // Add any other properties your user object may have
      }
      interface Request {
          user?: User; // Add this to the Request interface
      }
      
  }
}
