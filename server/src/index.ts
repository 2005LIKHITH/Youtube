import dotenv from 'dotenv'
import {app} from './app'
import {connectDB} from './db/db'


dotenv.config({
    path : './.env'
})

connectDB().then(()=>{
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
    app.listen(port,() => {
        console.log(`Server is running on port ${port}`)
    })


}).catch((err:Error) => {
    console.error("MongoDB Connection Failed", err)
})
