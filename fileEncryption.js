let crypto = require('crypto');
let fs = require('fs');
let algorithm = "aes-192-cbc";
let iv = crypto.randomBytes(16);
let key = crypto.scryptSync("mySecretKey","salt",24);
function encryptFile(input,output){
    let inputStream = fs.createReadStream(input);
    let outputStream = fs.createWriteStream(output);
    let cipher = crypto.createCipheriv(algorithm,key,iv);
    inputStream.on("data",(data)=>{
        outputStream.write(cipher.update(data));
    })
    inputStream.on("end",()=>{
        outputStream.end();
    })
}
function decryptFile(input,output){
    let inputStream = fs.createReadStream(input);
    let outputStream = fs.createWriteStream(output);
    let decipher = crypto.createDecipheriv(algorithm,key,iv);
    inputStream.on("data",(data)=>{
        outputStream.write(decipher.update(data));
    })
    inputStream.on("end",()=>{
        outputStream.end();
    })
}
// encryptFile("./text2.txt","./text2.enc")
decryptFile("./text2.enc","./text2.txt")