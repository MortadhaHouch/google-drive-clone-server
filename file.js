let bcrypt = require('bcrypt');
const User = require('./models/user');
const connectToDB = require('./database/database');
connectToDB()
async function checkUser(email, password) {
    try {
        let user = await User.findOne({email});
        let match =await bcrypt.compare(password,user.password);
        console.log(user,match);
    } catch (error) {
        console.log(error);
    }
}
checkUser("mortadha@gmail.com", "azerty");