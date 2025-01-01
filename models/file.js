let {Schema,model} = require("mongoose");
let fileSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    path:{
        type: String,
        required: true
    },
    size:{
        type: Number,
        required: false
    },
    downloads:{
        type: Number,
        default: 0
    },
    owner:{
        type: Schema.Types.ObjectId,
        required: true
    },
    isPrivate:{
        type: Boolean,
        default: true
    },
    views:{
        type: Number,
        default: 0
    }
},{timestamps: true});
module.exports = model("file",fileSchema);