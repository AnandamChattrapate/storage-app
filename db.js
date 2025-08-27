const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'ballast.proxy.rlwy.net',
  port: 31834,
  user: 'root',
  password: 'dVqTsJbWKXENVwopxLzoMFtJunkbsnCD',
  database: 'railway'
});

connection.connect((err) => {
  if (err) {
    console.error('DB connection failed:', err);
    return;
  }
  console.log('Connected to Railway MySQL!');
});

module.exports = connection;
