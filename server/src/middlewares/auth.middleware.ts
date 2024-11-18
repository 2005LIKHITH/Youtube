import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/user.model";

export const verifyJWT = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) throw new ApiError(401, "Unauthorized user");

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as  IUser;
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");

    if (!user) throw new ApiError(401, "Invalid access token");
        /*
            NOTE FOR ME:
            he error Property 'user' does not exist on type 'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>' is 
            a common TypeScript issue when trying to add a custom property (like user) to the Request object in Express.

        */
    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, "Invalid or expired access token");
  }
});
