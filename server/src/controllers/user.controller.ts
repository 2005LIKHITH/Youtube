import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User, IUser } from "../models/user.model";
import { uploadOnCloudinary , deleteImageFromCloudinary} from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import { addAbortSignal } from "stream";
import mongoose, { ObjectId, Schema, Types } from "mongoose";
import { Subscription } from "../models/subscription.model";
import { Video } from "../models/video.model";
import { Like } from "../models/like.model";
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
    // console.log(username)
    username.toLowerCase();

    if (!username || !username.trim())
        throw new ApiError(400, "Username is missing");
    // console.log(username)


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
    console.log(otherUserProfile)


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
const viewSubscribers = asyncHandler(async (req: Request, res: Response) => {
    const id = req.user?._id as string;
    
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid User ID");
    }

    const userSubscribers = await User.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        {
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'channel',
                as: 'subscribers',
            },
        },
        {
            $unwind: {
                path: '$subscribers',
                preserveNullAndEmptyArrays: false,
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'subscribers.subscriber',
                foreignField: '_id',
                as: 'subscriberDetails',
            },
        },
        {
            $unwind: {
                path: '$subscriberDetails',
            },
        },
        {
            $project: {
                _id: 0,
                subscriberId: '$subscriberDetails._id',
                subscriberUsername: '$subscriberDetails.username',
                subscriberFullName: '$subscriberDetails.fullName',
                subscriberAvatar: '$subscriberDetails.avatar',
            },
        },
    ]);

    if (!userSubscribers || userSubscribers.length === 0) {
        throw new ApiError(404, "No subscribers found for this user");
    }

    res.status(200).json({
        success: true,
        message: "Subscribers fetched successfully",
        subscribers: userSubscribers,
    });
});
const deleteAvatarImage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) throw new ApiError(400, "User ID is missing");
    if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "Invalid User ID");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (user.avatar) {
        try {
            const avatarPublicId = user.avatar.split('/').pop()?.split('.')[0];
            if (avatarPublicId) {
                await deleteImageFromCloudinary(avatarPublicId);
            }
        } catch {
            throw new ApiError(500, "Failed to delete avatar image");
        }
    }

    user.avatar = "";
    await user.save();

    return res.status(200).json({
        success: true,
        message: "Avatar image deleted successfully",
    });
});
const deleteCoverImage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) throw new ApiError(400, "User ID is missing");
    if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "Invalid User ID");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (user.coverImage) {
        try {
            const coverPublicId = user.coverImage.split('/').pop()?.split('.')[0];
            if (coverPublicId) {
                await deleteImageFromCloudinary(coverPublicId);
            }
        } catch {
            throw new ApiError(500, "Failed to delete cover image");
        }
    }

    user.coverImage = "";
    await user.save();

    return res.status(200).json({
        success: true,
        message: "Cover image deleted successfully",
    });
});

const getWatchHistory  = asyncHandler(async (req: Request , res:Response) => {
    const  user = await User.aggregate([
        {
            $match : { _id : new mongoose.Types.ObjectId(req.user?._id as string) }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline :[
                    {
                        $lookup :{
                            from : "users" ,
                            localField : "owner",
                            foreignField : "_id" ,
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        userName : 1,
                                    }
                                }
                            ]
                        }
                    },{
                        $addFields : {owner : {$first : "$owner"}}
                    },{
                        $project : {
                            thumbnail : 1,
                            duration : 1,
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200 , user[0]?.watchHistory , "watch history fetched successfully")
    )
})
const deleteWatchHistory = asyncHandler(async (req: Request , res:Response) => {
    const user = await User.findById(req.user?._id);
    if(!user) throw new ApiError(404 , "User not found");

    user.watchHistory = [];
    await user.save();

    return res.status(200).json(
        new ApiResponse(200 , "" , "watch history deleted successfully")
    )
})


const videoWatched = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (!mongoose.isValidObjectId(req.params.id)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video :any= await Video.findById(req.params.id);
    if (!video) throw new ApiError(404, "Video not found");
    
    if (video.owner.toString() === userId.toString()) {
        throw new ApiError(400, "You cannot watch your own video");
    }
    
    if (!user.watchHistory.some((id) => id.toString() === video._id.toString())) {
        user.watchHistory.push(video._id); 
        await user.save();
    }

    return res.status(200).json(new ApiResponse(200, "Video watched successfully",{
        message: "Video watched successfully",}));
});

export {getUserProfile,getOtherUsersProfile,updateUserProfile,
    viewSubscribers,updateUserAvatarImage,updateUserCoverImage,
    getWatchHistory,deleteWatchHistory,subscribeUnsubscribe,deleteAvatarImage,deleteCoverImage,videoWatched};