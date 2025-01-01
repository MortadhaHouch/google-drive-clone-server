let express = require('express');
let fileRouter = express.Router();
let jwt = require("jsonwebtoken");
let User = require("../models/user");
let bcrypt = require("bcrypt")
let File = require("../models/file");
let multer = require("multer");
let path = require("path");
let contentType = require("../contentType");
let fs = require("fs");
let zlib = require("zlib");
let FormData = require("form-data");
let Folder = require("../models/folder");
const storage = multer.diskStorage({
    filename:async(req,file,cb)=>{
        const userId = req.session.id;
        if(userId){
            let user = await User.findById(userId);
            if(user){
                cb(null,file.originalname);
            }
        }else{
            cb("file name error");
        }
    },
    destination:async(req,file,cb)=>{
        const userId = req.session.id;
        if(userId){
            let user = await User.findById(userId);
            if(user){
                cb(null, `./uploads/${user.firstName}_${user.lastName}`);
            }
        }else{
            cb("destination name error");
        }
    }
})
const uploads = multer({storage})
require("dotenv").config();
fileRouter.get("/:p?",async(req,res)=>{
    if(req.cookies.jwt_token){
        let {email} = jwt.verify(req.cookies.jwt_token,process.env.SECRET_KEY);
        let user = await User.findOne({email});
        if(user){
            if(!isNaN(parseInt(req.params.p))){
                let files = [];
                for await (const element of user.files.slice(Number(req.params.p),Number(req.params.p)+10)) {
                    let file = await File.findById(element);
                    files.push({
                        name:file.name,
                        size:file.size,
                        id:file._id,
                        downloads:file.downloads,
                        createdAt:file.createdAt,
                        updatedAt:file.updatedAt,
                        isPrivate:file.isPrivate,
                        views:file.views,
                        isFile:true
                    })
                }
                res.status(200).json({files})
            }else{
                let files = [];
                for await (const element of user.files) {
                    let file = await File.findById(element);
                    files.push({
                        name:file.name,
                        size:file.size,
                        id:file._id,
                        downloads:file.downloads,
                        createdAt:file.createdAt,
                        updatedAt:file.updatedAt,
                        isPrivate:file.isPrivate,
                        views:file.views,
                        isFile:true
                    })
                }
                res.status(200).json({files})
            }
        }else{
            res.status(401).json({error:"user not found"});
        }
    }
})
fileRouter.get("/by-id/:id", async (req, res) => {
    try {
        if (!req.cookies.jwt_token) {
            return res.status(401).json({ error: "Unauthorized access" });
        }
        const { email } = jwt.verify(req.cookies.jwt_token, process.env.SECRET_KEY);
        const { id } = req.params
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }
        const file = await File.findById(id);
        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }
        if (file.owner.toString() !== user._id.toString()) {
            return res.status(401).json({ error: "Unauthorized access" });
        }
        const filePath = path.resolve(file.path);
        const readStream = fs.createReadStream(filePath);
        const formData = new FormData();
        formData.append("file", readStream, {
            filename: file.name,
            contentType: "application/octet-stream",
        });
        formData.append(
            "data",
            JSON.stringify({
                name: file.name,
                size: file.size,
                downloads: file.downloads,
                createdAt: file.createdAt,
                updatedAt: file.updatedAt,
                isPrivate: file.isPrivate,
                views: file.views,
                owner: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                },
            })
        );
        res.setHeader("Content-Type", `multipart/form-data; boundary=${formData.getBoundary()}`);
        formData.pipe(res);
        readStream.on("error", (err) => {
            console.error("Error reading file:", err);
            res.status(500).json({ error: "Failed to stream file" });
        });
    } catch (error) {
        console.error("Error in file download:", error);
        res.status(500).json({ error: "Server error" });
    }
});
fileRouter.post("/upload",async(req,res)=>{
    if(req.cookies.jwt_token){
        let {email} = jwt.verify(req.cookies.jwt_token,process.env.SECRET_KEY);
        let user = await User.findOne({email});
        if(user){
            let {files} = req;
            const fileUploadPromises = [];
            for (const element of Object.values(files)) {
                const uploadPromise = new Promise((resolve, reject) => {
                    element.mv(path.join(__dirname, `../uploads/${user.firstName}_${user.lastName}/uploads/${element.name}`), async (err) => {
                        if (err) {
                            console.log(err);
                            return reject(err);
                        }
                        let file = await File.create({
                            name: element.name,
                            size: element.size,
                            path: path.join(__dirname, `../uploads/${user.firstName}_${user.lastName}/uploads/${element.name}`)
                        });
                        user.files.push(file._id);
                        resolve();
                    });
                });
                fileUploadPromises.push(uploadPromise);
            }
            await Promise.all(fileUploadPromises);
            await user.save();
            let token = jwt.sign({ message: "Files uploaded successfully" }, process.env.SECRET_KEY);
            res.status(200).json({ token });
        }else{
            let token = jwt.sign({error:"user not found"},process.env.SECRET_KEY);
            res.status(401).json(token);
        }
    }
})
module.exports = fileRouter