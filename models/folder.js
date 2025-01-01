let {Schema,model} = require("mongoose");
let folderSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    path:{
        type: String,
        required: true
    },
    owner:{
        type: Schema.Types.ObjectId,
        required: true
    },
    size:{
        type: Number,
        required: false
    },
    createdOn:{
        type: String,
        default: Date.now().toString(),
    },
    modifiedOn:{
        type: String,
        default: Date.now().toString(),
    },
    files:{
        type: [Schema.Types.ObjectId],
    },
    folders:{
        type: [Schema.Types.ObjectId],
    },
    downloads:{
        type: Number,
        default: 0
    }
});
module.exports = model("folder",folderSchema);