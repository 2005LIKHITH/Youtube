import mongoose, { Schema, Document, Model } from "mongoose";
import jwt from "jsonwebtoken";
import argon2 from "argon2";

export interface IUser extends Document {
    userName: string;
    email: string;
    fullName: string;
    avatar?: string;
    coverImage?: string;
    watchHistory: mongoose.Types.ObjectId[];
    password: string;
    refreshToken: string;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

const userSchema = new Schema<IUser>(
    {
        userName: { type: String, required: true, index: true, unique: true },
        email: { type: String, required: true, unique: true },
        fullName: { type: String, required: true },
        avatar: { type: String, default: "" },
        coverImage: { type: String, default: "" },
        watchHistory: { type: [mongoose.Types.ObjectId], default: [] },
        password: { type: String, required: [true, "Password is required"] },
        refreshToken: { type: String, default: "" },
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
      if (!this.password.startsWith('$argon2')) {
        try {
          const hashedPassword = await argon2.hash(this.password);
          console.log('Password being hashed:', this.password);
          this.password = hashedPassword;
          console.log('Hashed password:', this.password);
        } catch (err) {
          return next();
        }
      }
    }
    next();
  });
  

userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
    try {
        // Verify the password using Argon2
        return await argon2.verify(this.password, password);
    } catch (error) {
        console.error("Error verifying password:", error);
        return false;
    }
};

userSchema.methods.generateAccessToken = function (): string {
    return jwt.sign(
        {
            _id: this._id,
            userName: this.userName,
            email: this.email,
            fullName: this.fullName,
            avatar: this.avatar,
            coverImage: this.coverImage,
            watchHistory: this.watchHistory,
        },
        process.env.ACCESS_TOKEN_SECRET!,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY!,
        }
    );
};

userSchema.methods.generateRefreshToken = function (): string {
    return jwt.sign(
        {
            _id: this._id,
            userName: this.userName,
        },
        process.env.REFRESH_TOKEN_SECRET!,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
