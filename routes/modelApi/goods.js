const express = require('express')
const router = express.Router()
const db = require('../../config/db') // 调用你的 MySQL 连接池

// 登出接口
router.get('/goodsApi', (req, res) => {
  console.log('商品列表：')
  res.json({
    code: 200,
    message: '获取用户信息成功',
  })
})

module.exports = router
