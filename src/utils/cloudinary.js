import {v2 as cloudinary} from "cloudinary"
import { log } from "console"
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null

        const response = await cloudinary.uploader.upload( localFilePath, { resource_type:"auto" } )
        fs.unlinkSync(localFilePath)
        return response

    } catch (error) {
        fs.unlinkSync(localFilePath)  // remove the temporary saved file.
        return null;
    }
}

const deleteFromCloudinary = async(fileId, fileType) => {
    try {
        const response =  await cloudinary.uploader.destroy(fileId, {resource_type: fileType})
        return response ? true: false
    } catch (error) {
        return null;
    }
}


export {uploadOnCloudinary, deleteFromCloudinary}
