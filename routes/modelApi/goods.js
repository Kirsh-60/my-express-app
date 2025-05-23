const express = require('express')
const router = express.Router()
const db = require('../../config/db') // 调用你的 MySQL 连接池

// 获取商品列表接口
router.get('/goodsApi/:page', async (req, res) => {
  const page = parseInt(req.params.page, 10) || 1
  const pageSize = 10 // 每页显示的商品数量
  // 做分页
  const offset = (page - 1) * pageSize // 计算偏移量

  // 动态构建 SQL 查询条件
  let sql = 'SELECT * FROM goods'
  let sqlCount = 'SELECT COUNT(*) as total FROM goods'
  let params = []

  // 遍历 req.query 动态构建条件
  const conditions = []
  for (const [key, value] of Object.entries(req.query)) {
    if (value) {
      conditions.push(`${key} = ?`)
      params.push(value)
    }
  }

  // 如果有条件，拼接 WHERE 子句
  if (conditions.length > 0) {
    const whereClause = conditions.join(' AND ')
    sql += ` WHERE ${whereClause}`
    sqlCount += ` WHERE ${whereClause}`
  }

  // 添加分页
  sql += ' LIMIT ?, ?'
  params.push(offset, pageSize)

  try {
    const [rows] = await db.query(sql, params) // <-- 在这里打断点，检查 SQL 查询结果
    const [[{ total }]] = await db.query(sqlCount, params.slice(0, -2)) // 不需要分页参数
    res.json({
      code: 200,
      msg: '获取商品列表成功',
      data: {
        list: rows,
        total,
      },
    })
  } catch (err) {
    console.error('获取商品列表失败：', err) // <-- 在这里打断点，检查错误信息
    res.status(200).json({
      code: -1,
      msg: '获取商品列表失败',
      data: null,
    })
  }
})

router.post('/addGoods', async (req, res) => {
  const { goods_name, img, tab } = req.body
  console.log('添加商品请求参数：', req.body) // 打印请求参数;

  // 检查商品名称是否为空
  if (!goods_name) {
    return res.status(200).json({
      data: {
        code: -1,
        msg: '商品名称不能为空',
        data: null,
      },
    })
  }
  // 检查商品名称是否已存在
  const checkSql = 'SELECT * FROM goods WHERE goods_name = ?'
  const checkParams = [goods_name]
  const [checkRows] = await db.query(checkSql, checkParams)
  if (checkRows.length > 0) {
    return res.status(200).json({
      data: {
        code: -1,
        msg: '商品名称已存在',
        data: null,
      },
    })
  }
  const sql = 'INSERT INTO goods (goods_name,image,tab) VALUES (?,?,?)'
  const params = [goods_name, img[0].url, tab]

  try {
    const [result] = await db.query(sql, params)
    res.json({
      data: {
        code: 200,
        msg: '添加商品成功',
      },
    })
  } catch (err) {
    console.error('添加商品失败：', err)
    res.status(500).json({
      code: -1,
      msg: '添加商品失败',
      data: null,
    })
  }
})

module.exports = router
