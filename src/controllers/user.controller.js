import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token.")
    }
}

const registerUser = asyncHandler( async(req, res) => {
    
    //getting data from FORM 
    const {fullName, email, userName, password} = req.body;

    //validating data 
    if ( [fullName, email, userName, password].some((field)=> field?.trim()==="") ){
        throw new ApiError(400, "All fields are required")
    }   

    //checking if user is already registered
    const existedUser = await User.findOne({ $or: [{ userName }, { email }] })
    if(existedUser){
        throw new ApiError(409, "User with email or username is already existed")
    }

    //handling uploading images in multer
    const avatarLocalPath = req.files?.avatar[0]?.path;         // uploaded using multer
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if( req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
      coverImageLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    // uploading file on Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar || !coverImage){
        throw new ApiError(400, "Something went wrong while uploading avatar and coverImage on cloudinary.")
    }

    //creating user on db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        userName: userName.toLowerCase(),
        password
    })

    //checking if user got registered and removing password and refreshToken
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser){
        throw new ApiError(500, "Something went Wrong while registering the user.")
    }
    
    // sending final response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})

const loginUser = asyncHandler( async(req, res) => {

    // getting data from form
    const {userName, email, password} = req.body
    
    //check if username or email are there
    if ( !(userName || email) ){
        throw new ApiError(400, "Username or Email is required")
    }
    //find user
    const user = await User.findOne({ $or: [{userName}, {email}] })
    if (!user){
        throw new ApiError(404, "User does not exist")
    }

    //match password
    const isValidPassword = await user.isPasswordCorrect(password)
    if (!isValidPassword){
        throw new ApiError(401, "Invalid User Credentials")
    }
    
    //access and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    //send cookie
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, 
            {user: loggedInUser, refreshToken, accessToken},
            "User logged in Successfully"
        ))
})

const logoutUser = asyncHandler( async(req, res)=> {
    User.findByIdAndUpdate(req.user._id, 
        { 
            $set : {
                refreshToken: undefined
            }
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse( 200, {}, "User logged out" ))
})

const refreshAccessToken = asyncHandler(async(req, res)=> {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired")
        }
    
        const options = {
            httpOnly:true,
            secure: true
        }
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user?._id)
    
        return res.status(200)
        .cookie('accessToken', accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, {accessToken, refreshToken: newRefreshToken}, "Access token refreshed" ))
        
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler( async(req, res)=> {

    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    if (await user.isPasswordCorrect(oldPassword) ){
        throw new ApiError(400, "Old password is incorrect.")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getUser = asyncHandler( async(req, res) => {  
    return req.status(200)
    .json(new ApiResponse(200, req.user, "Current User fetched Successfully."))
})

const updateAccountDetails = asyncHandler( async(req, res) => {
    
    const {fullName, email} = req.body
    if (!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(req.user?._id, { $set: { fullName, email }}, {new: true} ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "Account details updated."))
})

const updateUserAvatar = asyncHandler( async(req, res) => {
    
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar){
        throw new ApiError(400, "Error while uploading avatar on cloudinary")
    }

    const user = await User.findByIdAndUpdate(user.req?._id, { $set: {avatar: avatar.url} }, {new: true}).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "Avatar updated Successfully."))

})

const updateCoverImage = asyncHandler( async(req, res) => {
    
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image is missing")
    }

    const coverImage = await uploadOnCloudinary(avatarLocalPath)
    if(!coverImage){
        throw new ApiError(400, "Error while uploading cover image on cloudinary")
    }

    const user = await User.findByIdAndUpdate(user.req?._id, { $set: {coverImage: coverImage.url} }, {new: true}).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "Cover Image updated Successfully."))

})

const getUserChannelProfile = asyncHandler( async(req, res) => {
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {userName: username?.toLowerCase()}
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channels",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount : {
                    $size: "$subscribers"
                },
                channelsSubscribedTo: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.body?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exists.")
    }
    return res.status(200)
    .json(new ApiResponse(200, channel[0], "Channel data fetched Successfully"))
    
})


const getWatchHistory = asyncHandler( async(req, res) => {
    const user =  User.aggregate([
        {
            $match: { _id : new mongoose.Types.ObjectId(req.user._id) }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully"))
})

export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getUser, updateAccountDetails,updateUserAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory }
