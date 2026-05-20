import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()

export const connecDb = async()=>{
    try{
        const connection = await mongoose.connect(process.env.MONGODB)
        console.log('mongoDb connected Successfully',connection.connection.host)

    }catch(err){
        console.log(err)
    }
}