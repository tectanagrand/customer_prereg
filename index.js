const express = require("express");
const app = express();
const dotenv = require("dotenv").config({
    path: `./.env.${process.env.NODE_ENV}`,
});
const port = process.env.PORT;
const os = require("os");
const http = require("http");
const path = require("path");
const cors = require("cors");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const whitelist = require("./config/allowedOrigin");
const router = require("./routes");
const SAPGetterChores = require("./helper/SAPGetterChores");
const db = require("./config/connection");

const csrfProtection = csrf({
    cookie: true,
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
app.use(csrfProtection);
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

app.listen(port, "0.0.0.0", () => {
    console.log(`App running on ${port}`);
});
