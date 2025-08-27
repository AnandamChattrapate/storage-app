const mysql = require('mysql2');

// railway database credentials
const connection = mysql.createConnection({
  host: "ballast.proxy.rlwy.net",
  user: "root",
  password: "dVqTsJbWKXENVwopxLzoMFtJunkbsnCD",
  database: "railway",
  port: 31834
});

// connect
connection.connect((err) => {
  if (err) {
    console.error('Error connecting: ' + err.stack);
    return;
  }
  console.log('✅ Connected to Railway DB as id ' + connection.threadId);
});

module.exports = connection;
