import express , {urlencoded,Request,Response} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json({limit:'16kb'}));
app.use(urlencoded({extended:true,limit:'16kb'}));
app.use(cookieParser());
app.use(express.static('public'));

import userRoutes from "./routes/user.route";

app.use("/api/v1/user",userRoutes); 


export {app}