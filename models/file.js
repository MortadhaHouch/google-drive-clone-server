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
        required: true
    },
    downloads:{
        type: Number,
        default: 0
    }
},{timestamps: true});
module.exports = model("file",fileSchema);