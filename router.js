const express = require("express");
var router = express.Router();
const DIR = __dirname + "/ForeEnd/";

router.get("/", (req, res)=>{
    res.setHeader("Content-Type", "text/html");
    res.sendFile(DIR + "login.html");
});

router.get("/upload", (req, res)=>{
    res.setHeader("Content-Type", "text/html");
    res.sendFile(DIR + "upload.html");
});

router.post("/login", (req, res)=>{
    console.log(req.body.id);
    console.log(req.body.password);
    res.end("1");
});

module.exports = router;