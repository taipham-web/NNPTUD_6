const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DB || "nnptud_c6",
  waitForConnections: true,
  connectionLimit: 10,
});

async function testConnection() {
  const connection = await pool.getConnection();
  connection.release();
}

async function initSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      full_name VARCHAR(150) DEFAULT '',
      avatar_url VARCHAR(500) DEFAULT '',
      status TINYINT(1) DEFAULT 0,
      role_id INT DEFAULT 1,
      login_count INT DEFAULT 0,
      token_version INT NOT NULL DEFAULT 0,
      lock_time DATETIME NULL,
      is_deleted TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  try {
    await pool.execute(
      `ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0`,
    );
  } catch (error) {
    if (error.code !== "ER_DUP_FIELDNAME") {
      throw error;
    }
  }
}

module.exports = {
  pool,
  testConnection,
  initSchema,
};
