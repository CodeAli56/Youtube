import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({path:"./env"})

connectDB().then(()=>{
    app.listen(process.env.PORT || 5000, () => {
        console.log(`Backend is listening to PORT: ${process.env.PORT}`);
    })
}).catch((err)=>{
    console.log("Mongo DB Connection failed !!", err);
})


