import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js";
import { getAllVideos, publishAVideo, getVideoById, deleteVideo, updateVideo, togglePublishStatus } from "../controllers/video.controller.js";

const videoRouter = Router();
videoRouter.use(verifyJWT)

videoRouter.route("/").get(getAllVideos)
    .post(upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
]), publishAVideo)

videoRouter.route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo)

videoRouter.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default videoRouter;