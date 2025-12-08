const express = require('express')
const router = express.Router()
const axios = require('axios')
const db = require('../../config/db') // 调用你的 MySQL 连接池
// 微信小程序配置
const appid = 'wxa16c180ce0b5c9cf'
const secret = '5eb8d325bee5473696ab2d6c59ad67e7'
// 获取用户微信小程序openid
router.post('/getOpenid', async (req, res) => {
    try {
        const { code } = req.body
        // 向微信服务器发送请求获取openid
        const response = await axios.get(
            'https://api.weixin.qq.com/sns/jscode2session',
            {
                params: {
                    appid,
                    secret,
                    js_code: code,
                    grant_type: 'authorization_code',
                },
            }
        )
        console.log('获取openid响应:', response.data)
        const { openid, session_key } = response.data
        // 检查是否成功获取openid
        if (!openid) {
            return res.status(400).json({
                error: '无法获取openid',
            })
        } else {
            console.log('获取到的openid:', openid)
            // 调用/login接口进行用户登录 将用户数据存到数据库
            // 返回openid给小程序端
            const { nickName, avatarUrl } = req.body.userInfo || {}
            const [rows] = await db.query(
                'INSERT INTO app_users (openid, name, avatar) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, avatar = ?',
                [openid, nickName, avatarUrl, nickName, avatarUrl]
            )
            if (rows.affectedRows > 0) {
                console.log('用户信息已存储或更新:', {
                    openid,
                    name: nickName,
                    avatarUrl,
                })
            }
            res.json({
                openid,
                session_key, // 如果需要的话
            })
        }
    } catch (error) {
        console.error('获取openid失败:', error)
        res.status(500).json({
            error: '获取openid失败',
        })
    }
})

module.exports = router
