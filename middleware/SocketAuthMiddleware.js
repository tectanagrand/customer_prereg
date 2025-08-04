const { Socket } = require("socket.io");
const jwt = require("jsonwebtoken");

/**
 *
 * @param {Socket} socket
 * @param {() => void} next
 */
const SocketAuthMiddleware = async (socket, next) => {
    const { token } = socket.handshake.auth;
    try {
        const decoded = await jwt.verify;
    } catch (error) {}
};
