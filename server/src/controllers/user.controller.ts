import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User, IUser } from "../models/user.model";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import { addAbortSignal } from "stream";
import mongoose, { ObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model";

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
    const id = req.user?._id as string;

    if (!id) throw new ApiError(400, "User ID is missing");

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid User ID");
    }

    const objectId = new mongoose.Types.ObjectId(id); // Convert once

    const userProfile = await User.aggregate([
        {
            $match: { _id: objectId }, // Use objectId here
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                subscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $in: [req.user?._id, "$subscribers.subscriber"], // Check for subscription
                },
            },
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1, // Ensure isSubscribed is projected
            },
        },
    ]);

    if (!userProfile?.length) throw new ApiError(404, "User not found");

    return res
        .status(200)
        .json(new ApiResponse(200, userProfile[0], "User profile fetched successfully"));
});


const getOtherUsersProfile = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;

    if (!username || !username.trim())
        throw new ApiError(400, "Username is missing");

    const otherUserProfile = await User.aggregate([
        {
            $match: { userName: username.toLowerCase() },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                subscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
            },
        },
    ]);

    if (!otherUserProfile?.length)
        throw new ApiError(404, "User not found");

    return res
        .status(200)
        .json(
            new ApiResponse(200, otherUserProfile[0], "Other user's profile fetched successfully")
        );
});

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
const subscribeUnsubscribe = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(404, "User not found");

    const channel = await User.findById(id);
    if (!channel) throw new ApiError(404, "Channel not found");

    const isSubscribed = await Subscription.findOne({
        channel: channel._id,
        subscriber: user._id,
    });

    if (isSubscribed) {
        await isSubscribed.deleteOne();
        res.status(200).json({
            success: true,
            message: "Unsubscribed successfully",
        });
    } else {
        await Subscription.create({
            channel: channel._id,
            subscriber: user._id,
        });
        res.status(200).json({
            success: true,
            message: "Subscribed successfully",
        });
    }
});


export {getUserProfile,getOtherUsersProfile,updateUserProfile,updateUserAvatarImage,updateUserCoverImage,subscribeUnsubscribe};