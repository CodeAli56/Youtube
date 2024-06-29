import {Router} from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentPassword, getUser, updateAccountDetails, updateUserAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"


const userRouter = Router()

userRouter.route("/register").post( 
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
]), registerUser)


userRouter.route("/login").post(loginUser)
userRouter.route("/logout").post(verifyJWT, logoutUser)
userRouter.route("/refreshToken").post(refreshAccessToken)
userRouter.route("/change-password").post(verifyJWT, changeCurrentPassword)
userRouter.route("/current-user").get(verifyJWT, getUser)
userRouter.route("/update-account").patch(verifyJWT, updateAccountDetails)
userRouter.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
userRouter.route("update-coverImage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)
userRouter.route("/channel/:username").get(verifyJWT, getUserChannelProfile)
userRouter.route("/history").get(verifyJWT, getWatchHistory)


export default userRouter