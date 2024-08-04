let express = require('express');
let folderRouter = express.Router();
folderRouter.get("/folders",(req,res)=>{
    res.json({folders:"folders"})
})
module.exports = folderRouter