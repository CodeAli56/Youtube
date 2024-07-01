import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    const videoLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path
    if ( !(videoLocalPath && thumbnailLocalPath)){
        throw new ApiError(400, "Video file and Thumbnail are required.")
    }
    
    const videoOnCloud = await uploadOnCloudinary(videoLocalPath)
    const thumbnailOnCloud = await uploadOnCloudinary(thumbnailLocalPath)
    if( !(videoOnCloud && thumbnailOnCloud)){
        throw new ApiError(500, "Something went wrong while uploading video and thumbnail on cloudinary.")
    }

    const owner = await User.findById(req.user._id)
    if (!owner){
        throw new ApiError(401, "Unauthorized request for publishing video.")
    }
    
    const video = await Video.create({
        videoFile: videoOnCloud.url,
        videoFileId: videoOnCloud.public_id,
        thumbnail : thumbnailOnCloud.url,
        thumbnailId: thumbnailOnCloud.public_id,
        title,
        description,
        duration: videoOnCloud.duration,
        owner: req.user._id,
        views: 0,
        isPublished: true
    })

    if (! await Video.findById(video._id)){
        throw new ApiError(500, "Something went wrong while publishing video.")
    }

    return res.status(200)
    .json(new ApiResponse(201, video, "Video successfully created"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    console.log(videoId);
    const video = await Video.findById(videoId)
    return res.status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully,"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body
    const newThumbnailLocalPath = req.file?.path;
    //TODO: update video details like title, description, thumbnail

    const video = await Video.findById(videoId)
    let newThumbnail;
    if(newThumbnailLocalPath){
        const deletedStatus = await deleteFromCloudinary(video.thumbnailId, "image")
        newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath)
        if( !(deletedStatus && newThumbnail)){
            throw new ApiError(500, "Something went wrong while updating thumbnail.")
        }
    }
    const thumbnail = newThumbnail.url
    const thumbnailId = newThumbnail.public_id
    const createdVideo = await Video.findByIdAndUpdate(videoId, {$set: {title, description, thumbnail, thumbnailId}}, {new: true} )
    
    return res.status(201)
    .json(new ApiResponse(201, createdVideo, "Video details updated Successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    const video = await Video.findById(videoId)
    const deletedStatus = await deleteFromCloudinary(video.videoFileId, "video") && 
                        await deleteFromCloudinary(video.thumbnailId, "image")
    if ( !deletedStatus){
        throw new ApiError(500, "Something went wrong while removing video from cloudinary")
    }
    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if( !deleteVideo){
        throw new ApiError(500, "Something went wrong while removing video from database")
    }

    return res.status(200)
    .json(new ApiResponse(200, {}, "Successfully deleted"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findOneAndUpdate( { _id: videoId },[{ $set: { isPublished: { $not: "$isPublished" }}}])

    return res.status(200)
    .json(new ApiResponse(200, video, "Successfully toggled."))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}