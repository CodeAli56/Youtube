import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body;
    const userId = req.user._id;

    const newPlaylist =await Playlist.create({
        name,
        description, 
        owner: userId
    })

    if( !newPlaylist){
        throw new ApiError(500, "Something went wrong while creating new playlist")
    }

    return res.status(201)
    .json(new ApiResponse(201, newPlaylist, "Successfully created."))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    const playlist = await Playlist.aggregate([
        {
            $match: {
                owner:new mongoose.Types.ObjectId(userId)
            }
        }
    ])

    if( !(playlist || typeof(playlist)==="Array" )){
        throw new ApiError(500, "Something went wrong while fetching user's playlist.")
    }

    return res.status(200)
    .json(new ApiResponse(200, playlist, "Successfully fetched playlist."))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    const playlist = await Playlist.findById(playlistId)

    if (!playlist){
        throw new ApiError(400, "No such playlist exist.")
    }

    return res.status(200)
    .json(new ApiResponse(200, playlist, "Successfully fetched."))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    
    const {playlistId, videoId} = req.params
    const video = await Video.findById(videoId)
    const playlist = await Playlist.findById(playlistId)
    playlist.videos = [... playlist.videos, video]
    const addedVideo = await playlist.save();
    if( !addedVideo){
        throw new ApiError(500, "Something went wrong while adding video in this playlist.")
    }
    
    return res.status(201)
    .json(new ApiResponse(201, addedVideo, "Successfully added." ))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {

    const {playlistId, videoId} = req.params

})

const deletePlaylist = asyncHandler(async (req, res) => {
    
    const {playlistId} = req.params
    const deletedPlaylist = await Playlist.findOneAndDelete({_id:playlistId, owner: req.user._id})
    if(!deletedPlaylist){
        throw new ApiError(500, "Unauthorized request.")
    }

    return res.status(200)
    .json(new ApiResponse(200, {}, "Successfully deleted."))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    const updatedPlaylist = await Playlist.findOneAndUpdate( {_id: playlistId, owner: req.user._id}, {$set: {name, description}}, {new: true})

    if( !updatedPlaylist){
        throw new ApiError(500, "Unauthorized request.")
    }

    return res.status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Successfully updated playlist."))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}