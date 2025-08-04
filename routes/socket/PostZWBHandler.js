const { Server } = require("socket.io");

/**
 *
 * @param {Server} server
 */
const PostZWBHandler = server => {
    const PostZWBSock = server.of("/postzwb");
    PostZWBSock.on("connection", socket => {});
};
