let express = require("express");
let jwt = require("jsonwebtoken")
let userRouter = express.Router();
let User = require("../models/user");
let bcrypt = require("bcrypt")
let File = require("../models/file");
let multer = require("multer");
let contentType = require("../contentType");
const fs = require('fs').promises;
const path = require('path');
let zlib = require("zlib");
let FormData = require("form-data");
let Folder = require("../models/folder")
let Bin = require("../models/bin")
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
    try {
        let { email, password } = req.body;
        let foundUser = await User.findOne({ email });
        if (foundUser) {
            let validPassword = await bcrypt.compare(password, foundUser.password);
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
                }, process.env.SECRET_KEY);
                res.status(200).json({ token });
            } else {
                let token = jwt.sign({
                    password_error: "Invalid password"
                }, process.env.SECRET_KEY);
                res.status(401).json({ token });
            }
        } else {
            let token = jwt.sign({
                    email_error: "User not found"
                }, process.env.SECRET_KEY);
            res.status(404).json({ token });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});
userRouter.post("/signup", async (req, res) => {
    try {
        let { firstName, lastName, password, email, file } = req.body;
        let user = await User.findOne({ email });
        if (user) {
            return res.json({ email_error: "User with this email already in use" });
        } else {
            let foundUser = await User.findOne({ firstName });
            if (foundUser) {
                return res.json({ firstName_error: "User with this name already exists" });
            } else {
                const userDir = `./uploads/${firstName}_${lastName}`;
                try {
                    await fs.mkdir(userDir, { recursive: true });
                } catch (err) {
                    return res.json({ folder_error: "Main user directory creation failed" });
                }
                try {
                    await fs.mkdir(path.join(userDir, 'uploads'));
                } catch (err) {
                    return res.json({ folder_error: "'uploads' directory creation failed" });
                }
                try {
                    await fs.mkdir(path.join(userDir, 'bin'));
                } catch (err) {
                    return res.json({ folder_error: "'bin' directory creation failed" });
                }
                let newUser = await User.create({
                    firstName,
                    lastName,
                    email,
                    password
                });
                let userAvatar = new File({
                    name: "avatar",
                    path: file
                });
                let bin = new Bin();
                newUser.avatar = userAvatar._id;
                await userAvatar.save();
                await bin.save();
                newUser.bin = bin._id;
                newUser.isLoggedIn = true;
                await newUser.save();
                let token = jwt.sign({
                    avatar: userAvatar.path,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    email: newUser.email,
                    isVerified: true
                }, process.env.SECRET_KEY);
                return res.status(201).json({ token });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
userRouter.get("/preview",async(req,res)=>{
    try {
        let {email} = jwt.verify(req.cookies.jwt_token,process.env.SECRET_KEY);
        let user = await User.findOne({email});
        if(user){
            let filesDownloadsCount = 0;
            let foldersDownloadsCount = 0;
            let storageSize = 0;
            for await (const element of user.files) {
                let foundFile = await File.findById(element);
                filesDownloadsCount+=foundFile.downloads;
                storageSize+=foundFile.size;
            }
            for await (const element of user.folders) {
                let foundFolder = await Folder.findById(element);
                foldersDownloadsCount+=foundFolder.downloads;
            }
            let token = jwt.sign({
                filesCount:user.files.length,
                foldersCount:user.folders.length,
                sharedFoldersCount:user.sharedFolders.length,
                sharedFilesCount:user.sharedFiles.length,
                filesDownloadsCount,
                foldersDownloadsCount,
                storageSize
            },process.env.SECRET_KEY);
            res.status(200).json({token});
        }
    } catch (error) {
        console.log(error);
    }
})
userRouter.put("/logout",async(req,res)=>{
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