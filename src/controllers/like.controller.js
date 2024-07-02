import {Like} from "../models/like.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user._id

    const existingLike = await Like.findOne({video: videoId, likedBy: userId})
    
    if (existingLike){
        await Like.deleteOne({_id:existingLike._id})
    }else{
        const newLike = new Like({video: videoId, likedBy: userId})
        await newLike.save();
    }

    return res.status(201)
    .json(new ApiResponse(201, {}, "Successfully updated video like status."))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user._id

    const existingLike = await Like.findOne({comment: commentId, likedBy: userId})

    if (existingLike){
        await Like.deleteOne({_id:existingLike._id})
    }else{
        const newLike = new Like({comment: commentId, likedBy: userId})
        await newLike.save();
    }

    return res.status(201)
    .json(new ApiResponse(201, {}, "Successfully updated comment like status."))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userId = req.user._id

    const existingLike = await Like.findOne({tweet: tweetId, likedBy: userId})

    if (existingLike){
        await Like.deleteOne({_id:existingLike._id})
    }else{
        const newLike = new Like({tweet: tweetId, likedBy: userId})
        await newLike.save();
    }

    return res.status(201)
    .json(new ApiResponse(201, {}, "Successfully updated tweet like status."))
})

const getLikedVideos = asyncHandler(async (req, res) => {

    const videos = await Like.find( { video: {$ne : null} , likedBy: req.user._id} )
    
    return res.status(200)
    .json(new ApiResponse(200, videos, "all liked video get fetched"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}