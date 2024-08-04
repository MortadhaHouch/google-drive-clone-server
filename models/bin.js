let {Schema,model} = require("mongoose");
let binSchema = new Schema({
    owner:{
        type:Schema.Types.ObjectId,
        required: true
    },
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