const express = require('express')
const router = express.Router()
const db = require('../../config/db') // 调用你的 MySQL 连接池

// 获取商品列表接口
router.get('/goodsApi/:page', async (req, res) => {
  const page = req.params.page
  // 你的分页逻辑
  const pageSize = 10 // 每页显示的商品数量
  const { tab, status } = req.query
  console.log(page, tab, status)
  // 做分页
  const offset = (page - 1) * pageSize // 计算偏移量
  const sql = `SELECT * FROM goods WHERE tab = ? AND status = ? LIMIT ?, ?`
  const sqlCount = `SELECT COUNT(*) as total FROM goods WHERE tab = ? AND status = ?`
  try {
    const [rows] = await db.query(sql, [tab, status, offset, pageSize])
    const [[{ total }]] = await db.query(sqlCount, [tab, status])
    res.json({
      code: 200,
      msg: '获取商品列表成功',
      data: {
        list: rows,
        total,
      },
    })
  } catch (err) {
    console.error('获取商品列表失败：', err)
    res.status(200).json({
      code: -1,
      msg: '获取商品列表失败',
      data: null,
    })
  }
})

module.exports = router
