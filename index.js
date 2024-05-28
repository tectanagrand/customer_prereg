const express = require("express");
const app = express();
const dotenv = require("dotenv").config({
    path: `./.env.${process.env.NODE_ENV}`,
});
const port = process.env.PORT;
const os = require("os");
const https = require("https");
const path = require("path");
const cors = require("cors");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const whitelist = require("./config/allowedOrigin");
const router = require("./routes");
const SAPGetterChores = require("./helper/SAPGetterChores");
const db = require("./config/connection");
const ignoreMethod = ["GET", "HEAD", "OPTIONS"];

const myCSRFProtection = (req, res, next) => {
    if (!ignoreMethod.includes(req.method) || req.url === "/api/getcsrftoken") {
        csrfProtection(req, res, next);
    } else {
        next();
    }
};

const servOption = {
    cert: fs.readFileSync("./ssl/certificate.crt"),
    key: fs.readFileSync("./ssl/private-key.pem"),
};

const csrfProtection = csrf({
    cookie: { sameSite: "none", secure: true },
});
const corsOption = {
    origin: function (req, callback) {
        if (whitelist.indexOf(req) !== -1) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE", "PATCH"],
    credentials: true,
    exposedHeaders: ["set-cookie", "Content-Disposition", "X-CSRF-Token"],
};
app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(myCSRFProtection);
app.use("/static", express.static(path.join(__dirname, "public")));
app.get("/api/getcsrftoken", (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});
app.use(router);
app.use(express.static(path.join(__dirname, "frontend/dist")));
app.get("/*$", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/dist", "index.html"));
});
// setInterval(() => {
//     console.log(db.totalCount);
// }, 1000);

if (process.env.NODE_ENV === "production") {
    const server1 = https.createServer(servOption, app);
    const server2 = https.createServer(servOption, app);
    const server3 = https.createServer(servOption, app);

    server1.listen(5000, () => {
        console.log(`App running 5000`);
    });

    server2.listen(443, () => {
        console.log(`App running 443`);
    });

    server3.listen(80, () => {
        console.log(`App running 80`);
    });
} else if (process.env.NODE_ENV === "development") {
    const server1 = https.createServer(servOption, app);
    server1.listen(process.env.PORT, () => {
        console.log(`App running ${process.env.PORT}`);
    });
} else {
    app.listen(port, "0.0.0.0", () => {
        console.log(`App running on ${port}`);
    });
}
// app.listen(port, "0.0.0.0", () => {
//     console.log(`App running on ${port}`);
// });
