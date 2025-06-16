const express = require('express')
const router = express.Router()

router.get('/mock', (req, res) => {
  // 生成随机数
  const randomNumber = Math.floor(Math.random() * 100)
  res.json({
    code: 200,
    msg: '获取商品列表成功',
    data: {
        data:{
            id: 1,
            name: randomNumber,
        }
    },
  })
})
module.exports = router
