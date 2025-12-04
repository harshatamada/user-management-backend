const express=require("express");
const dotenv=require("dotenv");
require("dotenv").config();
const cors=require("cors");
const db=require("./config/db");
const app=express();
const port=5000;
app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("backend is running");
})

db.getConnection((err,connection)=>{
    if(err){
        console.log("database connection failed",err);
    }
        else{
            console.log("database connected successfully");
            connection.release();
        }
    
})

const authRoutes=require("./routes/auth");
app.use("/api/auth",authRoutes);

app.listen(port,()=>{
    console.log("server is running on port 5000");
})

