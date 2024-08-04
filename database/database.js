const mongoose = require("mongoose")
require("dotenv").config();
async function connectToDB(){
    try {
        let client = await mongoose.connect(process.env.MONGOOSE_CONNECTION_URL);
        console.log("connected to DB");
        return client;
    } catch (error) {
        console.log(error);
    }
}
module.exports = connectToDB