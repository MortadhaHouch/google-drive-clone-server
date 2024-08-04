let express = require("express");
let jwt = require("jsonwebtoken")
let userRouter = express.Router();
let User = require("../models/user");
let bcrypt = require("bcrypt")
let File = require("../models/file");
let multer = require("multer");
let path = require("path");
let contentType = require("../contentType");
let fs = require("fs");
let zlib = require("zlib");
let FormData = require("form-data");
require("dotenv").config()
let storage = multer.diskStorage({
    filename:(req,file,cb)=>{
        cb(null,file.originalname);
    },
    destination:(req,file,cb)=>{
        cb(null,"./uploads");
    }
})
let uploads = multer({storage});
userRouter.post("/login", async (req, res) => {
    console.log(req.body);
    try {
        // Verify the JWT and extract email and password
        let { email, password } = jwt.verify(req.body.body, process.env.SECRET_KEY);
        let foundUser = await User.findOne({ email });
        
        if (foundUser) {
            console.log(`Found user: ${foundUser.email}`);
            console.log(`Stored hashed password: ${foundUser.password}`);
            
            let validPassword = await bcrypt.compare(password, foundUser.password);
            console.log(`Password comparison result: ${validPassword}`);
            
            if (validPassword) {
                let userAvatar = await File.findById(foundUser.avatar);
                let token = jwt.sign({
                    avatar:userAvatar.path,
                    firstName: foundUser.firstName,
                    lastName: foundUser.lastName,
                    email: foundUser.email,
                    isVerified: true,
                    filesCount:foundUser.files.length,
                    foldersCount:foundUser.folders.length,
                }, process.env.SECRET_KEY, { expiresIn: '1h' }); // Set token expiration time
                
                res.status(200).json({ token });
            } else {
                res.status(401).json({ password_error: "Invalid password" });
            }
        } else {
            res.status(404).json({ email_error: "User not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});
userRouter.post("/signup",async(req,res)=>{
    try {
        let {firstName,lastName,password,email,file} = jwt.verify(req.body.body,process.env.SECRET_KEY);
        let user = await User.findOne({email});
        if(user){
            res.json({email_error:"user with this email already in use"});
        }else{
            let foundUser = await User.findOne({firstName});
            if(foundUser){
                let token = jwt.sign({firstName_error:"user with this name already exists"},process.env.SECRET_KEY)
                res.json({token});
            }else{
                fs.mkdir(`./uploads/${firstName}_${lastName}`,async(err,data)=>{
                    if(err){
                        let token = jwt.sign({folder_error:"Failure ,Please try again"},process.env.SECRET_KEY)
                        res.json({token});
                    }
                    let newUser = await User.create({
                        firstName,
                        lastName,
                        email,
                        password
                    });
                    let userAvatar = new File({
                        name:file.name,
                        path:file.imageURL,
                        size:file.size
                    });
                    newUser.avatar = userAvatar._id;
                    newUser.isLoggedIn = true;
                    await newUser.save();
                    await userAvatar.save();
                    let token = jwt.sign({
                        avatar:userAvatar.path,
                        firstName:newUser.firstName,
                        lastName:newUser.lastName,
                        email:newUser.email,
                        isVerified:true
                    },process.env.SECRET_KEY);
                    res.status(201).json({token});
                })
            }
        }
    } catch (error) {
        console.log(error);
    }
})
userRouter.post("/logout",async(req,res)=>{
    try {
        console.log(req.cookies);
        if(req.cookies.jwt_token){
            let {email} = jwt.verify(req.body.body,process.env.SECRET_KEY);
            let user = await User.findOne({email});
            if(user){
                user.isLoggedIn = false;
                await user.save();
                let token = jwt.sign({
                    message:"logout success",
                }, process.env.SECRET_KEY);
                res.json({token});
            }else{
                let token = jwt.sign({
                    error:"failed to logout",
                }, process.env.SECRET_KEY);
                res.json({token});
            }
        }else{
            let token = jwt.sign({
                error:"something went wrong",
            }, process.env.SECRET_KEY);
            res.json({token});
        }
    } catch (error) {
        console.log(error);
    }
})
module.exports = userRouter;