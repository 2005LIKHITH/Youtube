import {Router} from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import {registerUser,loginUser,logOut,refreshAccesstoken,changeUserPassword} from "../controllers/auth.controller";
import { getUserProfile, getOtherUsersProfile, updateUserProfile,subscribeUnsubscribe } from "../controllers/user.controller";
const router:Router = Router();
router.route('/signup').post(
    upload.fields([
        {name:'avatar',maxCount:1},
        {name:'coverImage',maxCount:1}
    ]),
    registerUser
)
router.route('/login').post(loginUser);
router.route('/logout').post(verifyJWT,logOut);
router.route('/refresh-accesstoken').post(refreshAccesstoken);
router.route('/change-password').post(verifyJWT,changeUserPassword);
router.route('/get-profile').get(verifyJWT,getUserProfile); 
router.route('/get-profile/:username').get(getOtherUsersProfile);
router.route('/update/UserProfile').put(verifyJWT,updateUserProfile);   
router.route('/update/UserAvatarImage').put(verifyJWT,upload.single('avatar'),updateUserProfile);
router.route('/update/UserCoverImage').put(verifyJWT,upload.single('coverImage'),updateUserProfile);
router.route('/subscribe/:id').post(verifyJWT,subscribeUnsubscribe);
export default router