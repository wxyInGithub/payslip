module.exports = {
    user: "sa", 
    password: "dony2017!", 
    server: "192.168.0.3", 
    port: 1433, 
    database: "DES", 
    options: {
        encrypt: false
    }, 
    pool: {
        min:0, 
        max:10, 
        idleTimeoutMillis: 3000
    }
}