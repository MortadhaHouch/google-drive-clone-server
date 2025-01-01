let {Schema,model} = require("mongoose");
let binSchema = new Schema({
    files:{
        type:[Schema.Types.ObjectId],
        required: true
    },
    folders:{
        type:[Schema.Types.ObjectId],
        required: true
    },
    size:{
        type:Number,
        required: true,
        default:0
    }
});
module.exports = model("bin",binSchema);