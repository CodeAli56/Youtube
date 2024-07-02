import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const comments = await Comment.aggregate([
        {
            $match: {video: new mongoose.Types.ObjectId(videoId) }
        },
        {
            $limit: page * limit
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200, comments, "Comments successfully fetched."))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;

    const video = await Video.findById(videoId)
    const createdComment = await Comment.create({
        content,
        video: video._id,
        owner: req.user._id
    })
    if ( !createdComment){
        throw new ApiError(500, "Something went wrong while creating comment.")
    }

    return res.status(201)
    .json(new ApiResponse(201, {createdComment}, "Successfully added comment."))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body

    const newComment = await Comment.findOneAndUpdate({_id: commentId}, {content})
    if (!newComment){
        throw new ApiError(500, "Something went wrong while updating comment.")
    }

    return res.status(200)
    .json(new ApiResponse(200, newComment, "Successfully updated."))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    const deletedComment = await Comment.findByIdAndDelete(commentId)
    if (!deleteComment){
        throw new ApiError(500, "Something went wrong while deleting comment.")
    }

    return res.status(200)
    .json(new ApiResponse(200, {}, "Comment successfully deleted."))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }