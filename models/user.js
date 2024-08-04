let {Schema,model} = require('mongoose');
let bcrypt = require("bcrypt");
let userSchema = new Schema({
    firstName:{
        type: String,
        required: true
    },
    lastName:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    files:{
        type:[Schema.Types.ObjectId]
    },
    folders:{
        type:[Schema.Types.ObjectId]
    },
    bin:{
        type:Schema.Types.ObjectId
    },
    isLoggedIn:{
        type: Boolean,
        required: true,
        default: false
    },
    avatar:{
        type:Schema.Types.ObjectId,
    }
})
userSchema.pre('save', async function(next) {
    if (this.isModified('password') || this.isNew) {
        try {
            let salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            next();
        } catch (error) {
            next(error); // Pass the error to the next middleware
        }
    } else {
        next();
    }
});
module.exports = model("user",userSchema);