const que = require("./Queue");

const Q = {};

Q.pushJob = job => {
    que.push(async cb => {
        try {
            console.log(job);
            const result = await job;
            console.log(result);
            cb(null, result);
            return result;
        } catch (error) {
            console.error(error);
            cb(error, null);
        }
    });
};

Q.JobList = () => {
    console.log(que.length);
    return que.length;
};

module.exports = Q;
