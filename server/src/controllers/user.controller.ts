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
import { Comment } from "../models/comment.model";
import { CommunityPost } from "../models/communityPost.model";
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

    const video = await Video.findById(req.params.id);
    if (!video) throw new ApiError(404, "Video not found");
    
    if (video.owner.toString() === userId.toString()) {
        throw new ApiError(400, "You cannot watch your own video");
    }
    
    if (!user.watchHistory.some((id) => id.toString() === video._id .toString())) {
        user.watchHistory.push(video._id); 
        await user.save();
    }

    return res.status(200).json(new ApiResponse(200, "Video watched successfully",{
        message: "Video watched successfully",}));
});


const likeUnlike = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(400, "User ID is required");

    const { content: contentType, id: contentId } = req.params;
    if (!contentType) throw new ApiError(400, "Content type is required");
    if (!contentId) throw new ApiError(400, "Content ID is required");

    // Validate contentId
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
        throw new ApiError(400, "Invalid Content ID");
    }

    let content;
    if (contentType === "video") {
        content = await Video.findById(contentId);
        if (!content) throw new ApiError(404, "Video not found");
    } else if (contentType === "comment") {
        content = await Comment.findById(contentId); // Ensure `Comment` model is imported
        if (!content) throw new ApiError(404, "Comment not found");
    } else if (contentType === "communityPost") {
        content = await CommunityPost.findById(contentId); // Ensure `CommunityPost` model is imported
        if (!content) throw new ApiError(404, "Community Post not found");
    } else {
        throw new ApiError(400, "Invalid content type");
    }


    const existingLike = await Like.findOne({
        [contentType]: contentId,
        likedBy: userId,
    });

    if (existingLike) {
        // Unlike: Remove the existing like
        await existingLike.deleteOne();
        return res.status(200).json({ message: "Content unliked successfully" });
    } else {
        // Like: Create a new like
        const newLike = new Like({
            [contentType]: contentId,
            likedBy: userId,
        });
        await newLike.save();
        return res.status(200).json({ message: "Content liked successfully" });
    }
});

const createComment = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(400, "User ID is required");

    const { contentType, contentId } = req.params; 
    const { text } = req.body;

    if (!contentType) throw new ApiError(400, "Content type is required");
    if (!contentId) throw new ApiError(400, "Content ID is required");
    if (!text || text.trim() === "") throw new ApiError(400, "Comment text is required");

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
        throw new ApiError(400, "Invalid Content ID");
    }

    let content;

    switch (contentType) {
        case "video":
            content = await Video.findById(contentId);
            if (!content) throw new ApiError(404, "Video not found");
            break;
        case "communityPost":
            content = await CommunityPost.findById(contentId); 
            if (!content) throw new ApiError(404, "Community Post not found");
            break;
        default:
            throw new ApiError(400, "Invalid content type");
    }

    const comment = new Comment({
        userId,
        content: contentId,
        text,
        [`${contentType}Id`]: contentId, 
    });

    await comment.save();

    
if (!content.comments) content.comments = []; 
    content.comments.push(comment._id);
    await content.save();

    res.status(201).json({
        message: "Comment created successfully",
        comment,
    });
});

const deleteComment = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(400, "User ID is required");

    const { contentId, commentId } = req.params;
    if (!contentId) throw new ApiError(400, "Content ID is required");
    if (!commentId) throw new ApiError(400, "Comment ID is required");

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
        throw new ApiError(400, "Invalid Content ID");
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid Comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    if (!comment.userId.equals(userId)) { // Use .equals() for ObjectId comparison
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    // Delete the comment
    await Comment.deleteOne({ _id: commentId });

    // Pull the comment from the associated content (either Video or CommunityPost)
    const content = await Video.findById(contentId) || await CommunityPost.findById(contentId);

    if (!content) {
        throw new ApiError(404, "Content not found");
    }

    // Ensure content is of the correct type and update accordingly
    if (content instanceof Video) {
        await Video.updateOne({ _id: contentId }, { $pull: { comments: commentId } });
    } else if (content instanceof CommunityPost) {
        await CommunityPost.updateOne({ _id: contentId }, { $pull: { comments: commentId } });
    }

    res.status(200).json({ message: "Comment deleted successfully" });
});


export {getUserProfile,getOtherUsersProfile,updateUserProfile,
    viewSubscribers,updateUserAvatarImage,updateUserCoverImage,
    getWatchHistory,deleteWatchHistory,subscribeUnsubscribe,deleteAvatarImage,
    deleteCoverImage,videoWatched,likeUnlike,createComment,deleteComment};