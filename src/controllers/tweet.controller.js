import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body;
    const userId = req.user._id;

    const tweet = await Tweet.create({
        content,
        owner: userId
    })
    
    if(!tweet){
        throw new ApiError(500, "Something went wrong while creating tweet")
    }

    return res.status(201)
    .json(new ApiResponse(201, tweet, "Successfully created tweet."))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params;

    const allTweets = await Tweet.find({owner: userId})

    return res.status(200)
    .json(new ApiResponse(200, allTweets, "Successfully fetched all tweets."))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {content} = req.body;
    const userId = req.user._id;
    const {tweetId} = req.params;

    const updatedTweet = await Tweet.findOneAndUpdate({_id:tweetId, owner: userId }, {$set: {content}}, {new: true})
    if(!updatedTweet){
        throw new ApiError(401, "Unauthorized request.")
    }

    return res.status(201)
    .json(new ApiResponse(201, updatedTweet, "Successfully updated tweet."))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {tweetId} = req.params;

    const deletedTweet = await Tweet.findOneAndDelete( {_id:tweetId, owner: userId })
    if(!deletedTweet){
        throw new ApiError(401, "Unauthorized request.")
    }

    return res.status(201)
    .json(new ApiResponse(201, {} , "Successfully deleted tweet."))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}