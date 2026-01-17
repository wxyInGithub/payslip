const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const router = require("./router.js");

function logErrorToFile(error) {
    const logsDir = path.join(__dirname, 'logs');

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
    }

    const logFile = path.join(logsDir, 'error.log');
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ${error.stack || error}\n`;

    fs.appendFileSync(logFile, errorMessage);
}

const app = express();
app.all("*", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "DELETE, PUT, POST, GET, OPTIONS");
    if (req.method.toLowerCase() == "options")
        res.send(200);
    else
        next();
});
app.use(bodyParser.urlencoded({ extends: false }));
app.use(bodyParser.json());
// app.use((req, res, next)=>{
//     console.log("Someone requested server");
//     console.log("request url:", req.url);
//     console.log(`request time: ${date.format(new Date(), "YYYY-MM-DD HH:mm")}\n`)
//     next();
// });
app.use(express.static(path.join(__dirname, "ForeEnd")))
app.use(router);
app.use((err, req, res, next) => {
    console.error('Error:', err);
    logErrorToFile(err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    logErrorToFile(error);
    // Optional: restart the app or just continue running
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    logErrorToFile(reason);
});

app.listen(5000, "0.0.0.0", (req, res, next) => {
    console.log("server is running on 0.0.0.0:5000\n");
});