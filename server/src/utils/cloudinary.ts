import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { extractPublicId } from 'cloudinary-build-url';
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

const uploadOnCloudinary = async (localFilePath: string): Promise<UploadApiResponse | null> => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
};

const deleteImageFromCloudinary = async (url: string): Promise<boolean | null> => {
    try {
        if (!url) return null;

        const publicId = extractPublicId(url);
        const result = await cloudinary.uploader.destroy(publicId);

        return !!result;
    } catch (error) {
        return null;
    }
};

export { uploadOnCloudinary, deleteImageFromCloudinary };