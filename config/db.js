require('dotenv').config()
const mysql = require('mysql2/promise')

// 调试信息 - 部署后可以删除
console.log('🔍 数据库配置调试信息:')
console.log('DB_HOST:', process.env.DB_HOST)
console.log('DB_PORT:', process.env.DB_PORT)
console.log('DB_USER:', process.env.DB_USER)
console.log('DB_NAME:', process.env.DB_NAME)

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
})

// 测试连接
pool.getConnection()
    .then((connection) => {
        console.log('✅ MySQL 连接成功')
        connection.release()
    })
    .catch((err) => {
        console.error('✖ MySQL 连接失败：', err.message)
    })

module.exports = pool
