const q = require("../helper/Q");

const QueueController = {};

QueueController.pushNewQueue = (req, res) => {
    const job = req.query.job;
    q.pushJob(
        new Promise((resolve, reject) => {
            setTimeout(() => {
                reject("Job Error " + job);
            }, 5000);
        })
    );
    res.status(200).send({
        message: "success",
    });
};

QueueController.showQueue = (req, res) => {
    try {
        console.log(q.JobList());
        res.status(200).send({
            jobs: q.JobList(),
        });
    } catch (error) {
        res.status(500).send({
            message: error.message,
        });
    }
};

module.exports = QueueController;
