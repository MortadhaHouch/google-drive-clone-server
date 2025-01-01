let express = require('express');
let folderRouter = express.Router();
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
require("dotenv").config();
let fsExtra = require("fs-extra");
const { log } = require('console');
folderRouter.get("/:p?",async(req,res)=>{
    try {
        let {email} = jwt.verify(req.cookies.jwt_token,process.env.SECRET_KEY);
        let user = await User.findOne({email});
        if(user){
            if(isNaN(parseInt(req.params.p))){
                let folders = [];
                for await (const element of user.folders.slice(Number(req.params.p),Number(req.params.p)+10)) {
                    let folder = await Folder.findById(element);
                    folders.push({
                        name:folder.name,
                        size:folder.size,
                        createdOn:folder.createdOn,
                        modifiedOn:folder.modifiedOn,
                        files:folder.files.length,
                        downloads:folder.downloads,
                    })
                }
                res.status(200).json({folders})
            }else{
                let folders = [];
                for await (const element of user.folders) {
                    let folder = await Folder.findById(element);
                    folders.push({
                        name:folder.name,
                        size:folder.size,
                        createdOn:folder.createdOn,
                        modifiedOn:folder.modifiedOn,
                        files:folder.files.length,
                        downloads:folder.downloads,
                    })
                }
                res.status(200).json({folders})
            }
        }
    } catch (error) {
        console.log(error);
    }
})
folderRouter.post("/upload", async (req, res) => {
    if (!req.cookies.jwt_token) {
        return res.status(401).json({ error: "Unauthorized access" });
    }
    try {
        const { email } = jwt.verify(req.cookies.jwt_token, process.env.SECRET_KEY);
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const { files } = req;
        const { filePaths } = req.body;
        if (!Array.isArray(filePaths) || !files || !files.filesToUpload) {
            return res.status(400).json({ error: "Invalid folder paths or files missing" });
        }

        const filesToUpload = files.filesToUpload.map((file, index) => ({
            ...file,
            path: filePaths[index],
        }));

        for (const element of filesToUpload) {
            const uploadPath = path.join(
                __dirname,
                `../uploads/${user.firstName}_${user.lastName}/uploads/`,
                element.path
            );
            const folderPath = path.dirname(uploadPath);

            await fsExtra.ensureDir(folderPath);
            await new Promise((resolve, reject) => {
                element.mv(uploadPath, async (err) => {
                    if (err) {
                        console.error("Error moving file:", err);
                        return reject(err);
                    }
                    try {
                        await processFolder(folderPath, user);
                        resolve();
                    } catch (err) {
                        console.error("Error processing folder:", err);
                        reject(err);
                    }
                });
            });
        }

        await user.save();
        res.status(200).json({ message: "Files and folders uploaded successfully" });
    } catch (error) {
        console.error("Error during folder upload:", error);
        res.status(500).json({ error: "Server error" });
    }
});

async function processFolder(folderPath, user) {
    const folderLock = await Folder.findOne({
        path: folderPath,
        name: path.basename(folderPath),
        owner: user._id,
    });

    let folderObj;

    if (!folderLock) {
        folderObj = await Folder.create({
            name: path.basename(folderPath),
            path: folderPath,
            owner: user._id,
        });

        user.folders = Array.from(new Set([...user.folders, folderObj._id]));
        await user.save();
    } else {
        folderObj = folderLock;
    }

    // Read contents of the folder
    const folderContents = await fs.promises.readdir(folderPath);

    // Iterate over each item in the folder
    await Promise.all(
        folderContents.map(async (item) => {
            const itemPath = path.join(folderPath, item);
            const stats = await fs.promises.lstat(itemPath);

            if (stats.isDirectory()) {
                // If item is a directory, process it as a subfolder
                await processSubfolder(itemPath, item, folderObj, user);
            } else {
                // If item is a file, process it as an inner file
                await processInnerFile(itemPath, item, folderObj, user);
            }
        })
    );

    // Save the updated folder object
    await folderObj.save();
}

async function processSubfolder(itemPath, item, folderObj, user) {
    const subfolderLock = await Folder.findOne({
        path: itemPath,
        name: item,
        owner: user._id,
    });

    let subfolder;

    if (!subfolderLock) {
        subfolder = await Folder.create({
            path: itemPath,
            name: item,
            owner: user._id,
        });

        folderObj.folders = Array.from(new Set([...folderObj.folders, subfolder._id]));
        user.folders = Array.from(new Set([...user.folders, subfolder._id]));
        await folderObj.save();
        await user.save();
    } else {
        subfolder = subfolderLock;
    }

    // Recursively process the subfolder
    await processFolder(itemPath, user);
}


async function processInnerFile(itemPath, item, folderObj, user) {
    const fileLock = await File.findOne({
        path: itemPath,
        name: item,
        owner: user._id,
    });

    if (!fileLock) {
        const innerFile = await File.create({
            path: itemPath,
            name: item,
            owner: user._id,
            size: fs.lstatSync(itemPath).size,
        });

        folderObj.files = Array.from(new Set([...folderObj.files, innerFile._id]));
        user.files = Array.from(new Set([...user.files, innerFile._id]));
        await folderObj.save();
        await user.save();
    }
}

module.exports = folderRouter