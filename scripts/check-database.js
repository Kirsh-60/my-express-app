const mysql = require('mysql2/promise')
require('dotenv').config()

async function checkAndCreateTable() {
  let connection
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })

    console.log('✅ 数据库连接成功')
    
    // 检查当前数据库
    const [dbResult] = await connection.execute('SELECT DATABASE() as current_db')
    console.log('📍 当前数据库:', dbResult[0].current_db)
    
    // 显示现有表
    const [tables] = await connection.execute('SHOW TABLES')
    console.log('📋 现有表列表:')
    if (tables.length === 0) {
      console.log('  (无表)')
    } else {
      tables.forEach(table => {
        const tableName = Object.values(table)[0]
        console.log(`  - ${tableName}`)
      })
    }
    
    // 检查 app_users 表是否存在
    const [checkTable] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = ?
    `, [process.env.DB_NAME, 'app_users'])
    
    if (checkTable[0].count > 0) {
      console.log('✅ app_users 表已存在')
      
      // 显示表结构
      const [describe] = await connection.execute('DESCRIBE app_users')
      console.log('📊 app_users 表结构:')
      describe.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key} ${col.Default || ''}`)
      })
    } else {
      console.log('❌ app_users 表不存在，正在创建...')
      
      // 创建表
      const createTableSQL = `
        CREATE TABLE app_users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          openid VARCHAR(50) NOT NULL UNIQUE COMMENT '微信用户唯一标识',
          name VARCHAR(100) DEFAULT '微信用户' COMMENT '用户昵称',
          avatar TEXT COMMENT '用户头像URL',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
          INDEX idx_openid (openid)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微信用户表'
      `
      
      await connection.execute(createTableSQL)
      console.log('✅ app_users 表创建成功')
      
      // 验证表创建
      const [newDescribe] = await connection.execute('DESCRIBE app_users')
      console.log('📊 新创建的 app_users 表结构:')
      newDescribe.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key} ${col.Default || ''}`)
      })
    }
    
  } catch (error) {
    console.error('❌ 操作失败:', error.message)
    console.error('详细错误:', error)
  } finally {
    if (connection) {
      await connection.end()
      console.log('🔌 数据库连接已关闭')
    }
  }
}

checkAndCreateTable()
