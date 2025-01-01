let express = require("express")
let app = express()
let bodyParser = require("body-parser")
let cookieParser = require("cookie-parser");
let dotenv = require("dotenv");
const userRouter = require("./routes/userRouter");
let connectToDB = require("./database/database");
let cors = require("cors");
const fileRouter = require("./routes/fileRouter");
const folderRouter = require("./routes/folderRouter");
const session = require('express-session');
let expressUpload = require("express-fileupload");
connectToDB();
dotenv.config();
app.use(cors({
    methods:["GET","POST","PUT","DELETE"],
    origin:"http://localhost:5173",
    credentials:true
}))
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(expressUpload({
    preserveExtension:true,
    createParentPath:true,
}));
app.use(express.json({limit:"10mb"}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json({limit:"10mb"}));
app.use(cookieParser());
app.use("/user",userRouter);
app.use("/file",fileRouter);
app.use("/folder",folderRouter);
app.listen(process.env.PORT,()=>{
    console.log("listening on port "+process.env.PORT);
})