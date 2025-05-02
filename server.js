const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const router = require("./router.js");

const app = express();
app.all("*", (req, res, next)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "DELETE, PUT, POST, GET, OPTIONS");
    if(req.method.toLowerCase() == "options")
        res.send(200);
    else
        next();
});
app.use(bodyParser.urlencoded({extends: false}));
app.use(bodyParser.json());
// app.use((req, res, next)=>{
//     console.log("Someone requested server");
//     console.log("request url:", req.url);
//     console.log(`request time: ${date.format(new Date(), "YYYY-MM-DD HH:mm")}\n`)
//     next();
// });
app.use(express.static(path.join(__dirname, "ForeEnd")))
app.use(router);
app.listen(5000, "0.0.0.0", (req, res, next)=>{
    console.log("server is running on 0.0.0.0:5000\n");
});