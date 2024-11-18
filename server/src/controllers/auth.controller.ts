import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { IUser, User } from "../models/user.model";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import argon2 from "argon2";  

export interface FileRequest extends Request {
    files: {
        avatar?: Express.Multer.File[];
        coverImage?: Express.Multer.File[];
    };
}

const userRegistrationSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    userName: z.string().min(1, "Username is required"),
    password: z.string().min(6, "Password should be at least 6 characters long")
});

interface GenerateTokensResponse {
    accessToken: string;
    refreshToken: string;
}

const generateAccessAndRefreshToken = async (userId: any): Promise<GenerateTokensResponse> => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong");
    }
};

export { generateAccessAndRefreshToken };

const registerUser = asyncHandler(async (req: FileRequest, res: Response) => {
    const { fullName, email, userName, password } = userRegistrationSchema.parse(req.body);

    const existedUser = await User.findOne({
        $or: [{ email }, { userName }]
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    let avatarLocalPath: string | undefined;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path;
    }

    let coverImageLocalPath: string | undefined;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    let avatar;
    if (avatarLocalPath) {
        avatar = await uploadOnCloudinary(avatarLocalPath);
    }

    let coverImage;
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    const hashedPassword = await argon2.hash(password);  

    const user = await User.create({
        fullName,
        avatar: avatar?.url || "",
        coverImage: coverImage?.url || "",
        email,
        password: hashedPassword,
        userName: userName.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user!!");
    }

    return res.status(201).json(new ApiResponse(200, "User registered successfully", createdUser));
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!(email && password)) {
        throw new ApiError(400, "Email and password are required");
    }

    // Fetch the user by email
    const userDetails = await User.findOne({ email });

    if (!userDetails) {
        throw new ApiError(404, "User does not exist");
    }

    // Verify the password
    const isPasswordValid = await argon2.verify(userDetails.password, password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Password is incorrect");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(userDetails._id);

    // Fetch the user without sensitive information
    const loggedInUser = await User.findById(userDetails._id).select("-password -refreshToken -OTP");

    // Cookie options for secure HTTP-only cookies
    interface CookieOptions {
        httpOnly: boolean;
        secure: boolean;
        sameSite: 'none' | 'lax' | 'strict';  // Lowercase values for Express compatibility
    }

    const accessTokenOptions: CookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'strict', 
    };

    const refreshTokenOptions: CookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'strict', 
    };

    // Set the cookies with the tokens
    res.cookie('refreshToken', refreshToken, refreshTokenOptions);
    res.cookie('accessToken', accessToken, accessTokenOptions);

    return res.status(200).json(new ApiResponse(200, "User logged in successfully...", { user: loggedInUser, accessToken, refreshToken }));
});

const logOut = asyncHandler(async (req: Request, res: Response) => {
    const id = req.user?._id;
    User.findById(id).then((user) => {
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        user.refreshToken = "";
        user.save({ validateBeforeSave: false });
        res.clearCookie("refreshToken");
        res.clearCookie("accessToken");
        return res.status(200).json(new ApiResponse(200, "User logged out successfully",{
            message: "User logged out successfully"}));
    })
})
export { registerUser, loginUser,logOut };
