const express = require("express");
var router = express.Router();
const DIR = __dirname + "/ForeEnd/";

router.get("/", (req, res)=>{
    res.setHeader("Content-Type", "text/html");
    res.sendFile(DIR + "login.html");
});

module.exports = router;