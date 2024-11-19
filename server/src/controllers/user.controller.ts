import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { IUser, User } from "../models/user.model";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import argon2 from "argon2";  
import jwt from "jsonwebtoken";


/*

        All Functionalities of User Controller
        => Get User Profile
        => Update User Profile
        => Upload User Profile or Cover Image
        => Upload Posts/Delete Posts
        => Follow/Unfollow User
        => Like/Dislike Post/Comment
        => Comment on Post/ Delete Comment on Post
        => 




*/

const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const id = req.user?._id;
    
    const user  = await User.findById(id);

    if(!user)throw new ApiError(404,"User not found");
    return res.status(200).json(new ApiResponse(200,"User found successfully",user));
})

const getOtherUsersProfile = asyncHandler(async (req: Request, res: Response) => {
    console.log("Hitting getOtherUsersProfile");
    let username = req.params.username;
    username = username.toLowerCase();
    console.log(username);
    const user = await User.findOne({userName:username});
    ;
    console.log(user);
    
    if(!user)throw new ApiError(404,"User not found");
    return res.status(200).json(new ApiResponse(200,"User found successfully",user));
})
const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
    console.log("Updating user profile......");
    const { fullName, userName } = req.body;
    const id = req.user?._id;

    const user = await User.findById(id).select("-password -refreshToken");
    if (!user) throw new ApiError(404, "User not found");

    user.fullName = fullName;
    user.userName = userName;

    await user.save();

    return res.status(200).json(new ApiResponse(200, "User updated successfully", user));
});
const updateUserAvatarImage = asyncHandler(async (req: Request, res: Response) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) throw new ApiError(400, "Avatar image is required");

    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(404, "User not found");

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar?.url) throw new ApiError(500, "Error uploading avatar image");

    // Update user's avatar
    user.avatar = avatar.url;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Avatar updated successfully",
        avatarUrl: avatar.url,
    });
});

const updateUserCoverImage = asyncHandler(async (req: Request, res: Response) => {
    const coverLocalPath = req.file?.path;
    if (!coverLocalPath) throw new ApiError(400, "Cover image is required");

    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(404, "User not found");

    const cover = await uploadOnCloudinary(coverLocalPath);
    if (!cover?.url) throw new ApiError(500, "Error uploading cover image");


    user.coverImage = cover.url;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Cover image updated successfully",
        coverImageUrl: cover.url,
    });
});

export {getUserProfile,getOtherUsersProfile,updateUserProfile,updateUserAvatarImage,updateUserCoverImage};