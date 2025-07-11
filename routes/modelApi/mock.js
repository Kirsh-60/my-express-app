const express = require('express')
const router = express.Router()
const axios = require('axios')
// 微信小程序配置
const appid = 'wxa16c180ce0b5c9cf'
const secret = 'fce28912265139307baeace7bbfc31ce'
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

    // 返回openid给小程序端
    res.json({
      openid,
      session_key, // 如果需要的话
    })
  } catch (error) {
    console.error('获取openid失败:', error)
    res.status(500).json({
      error: '获取openid失败',
    })
  }
})
module.exports = router
