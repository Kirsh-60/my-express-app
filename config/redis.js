// redisClient.js
const { createClient } = require('redis')

// 创建Redis客户端（根据你的服务器配置）
const redisClient = createClient({
    socket: {
        host: '81.70.28.17', // 你的服务器IP
        port: 6379, // Redis端口
    },
    password: 'liuning5215', // 你的密码
    database: 0, // 数据库编号（0-15）
})

// 连接事件监听
redisClient.on('connect', () => {
    console.log('✅ 成功连接到Redis服务器')
})

redisClient.on('error', (err) => {
    console.error('❌ Redis连接错误:', err)
})

// 异步连接函数
async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect()
    }
    return redisClient
}

async function printRedisKey(key) {
    const client = await connectRedis()
    const value = await client.get(key)
    console.log(`key: ${key}, value:`, value)
    return value
}

async function setRedisKey(key, value) {
    const client = await connectRedis()
    await client.set(key, value)
    console.log(`Set key: ${key}, value:`, value)
    return true
}

module.exports = {
    redisClient,
    connectRedis,
    printRedisKey,
    setRedisKey,
}
