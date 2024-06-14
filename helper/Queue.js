const Queue = require("queue");

const q = new Queue({
    autostart: true,
    concurrency: 1,
});

q.emit("start", job => {
    console.log("job started");
});

q.emit("success", (result, job) => {
    console.log(`Job completed with result: ${result}`);
});

module.exports = q;
