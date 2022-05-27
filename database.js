const mysql = require('mysql2');
const dbConnection = mysql.createPool({
    host     : 'localhost', // MYSQL HOST NAME
    user     : 'root', // MYSQL USERNAME
    password : '', // MYSQL PASSWORD
    database : 'cs251_db', // MYSQL DB NAME
    //port: '8889'
}).promise();
module.exports = dbConnection;
