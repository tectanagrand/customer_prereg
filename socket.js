const { Server } = require("socket.io");
const { createServer } = require("http");

const socketServer = createServer();
const io = new Server(socketServer);

module.exports = { io, socketServer };
