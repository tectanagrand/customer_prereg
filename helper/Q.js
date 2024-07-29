const que = require("./Queue");

const Q = {};

Q.pushJob = job => {
    que.push(() => job);
};

Q.JobList = () => {
    console.log(que.length);
    return que.length;
};

module.exports = Q;
