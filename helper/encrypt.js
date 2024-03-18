const crypto = require("crypto");
require("dotenv").config({ path: `../.env.development` });

const algorithm = process.env.CRYPTALGO;
const key = "key01";
const iv = "iv1";
console.log(key);
console.log(iv);

const cipher = crypto.createCipheriv(algorithm, key, iv);

let encrypted = cipher.update("Bebas-01", "utf8", "hex");
encrypted += cipher.final("hex");
console.log(encrypted);

// const decipher = crypto.createDecipheriv(algorithm, key, iv);

// let decrypted = decipher.update(encrypted, 'hex', 'utf8');
// decrypted += decipher.final('utf8');

// console.log('Original text: ', 'Hello World');
// console.log('Encrypted text: ', encrypted);
// console.log('Decrypted text: ', decrypted);
