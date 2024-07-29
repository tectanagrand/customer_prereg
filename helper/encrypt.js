const ncrypt = require("ncrypt-js");
require("dotenv").config({ path: `../.env.development` });

const cipher = new ncrypt(process.env.TOKEN_KEY);
const encry = cipher.encrypt("");
console.log(encry);

// const decipher = crypto.createDecipheriv(algorithm, key, iv);

// let decrypted = decipher.update(encrypted, 'hex', 'utf8');
// decrypted += decipher.final('utf8');

// console.log('Original text: ', 'Hello World');
// console.log('Encrypted text: ', encrypted);
// console.log('Decrypted text: ', decrypted);
