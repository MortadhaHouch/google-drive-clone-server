let express = require('express');
let fileRouter = express.Router();
fileRouter.get("/files",(req,res)=>{
    res.json({files:"files"})
})
module.exports = fileRouter