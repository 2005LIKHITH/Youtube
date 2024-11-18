import {Router} from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import {registerUser,loginUser,logOut,refreshAccesstoken} from "../controllers/auth.controller";
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
export default router