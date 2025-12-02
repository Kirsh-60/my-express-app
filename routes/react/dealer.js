const express = require('express')
const router = express.Router()
// 引入数据库连接
const db = require('../../config/db')
function formatDate(value) {
    if (!value) return null
    const createTime = new Date(value)
    const year = createTime.getFullYear()
    const month = String(createTime.getMonth() + 1).padStart(2, '0')
    const day = String(createTime.getDate()).padStart(2, '0')
    const hours = String(createTime.getHours()).padStart(2, '0')
    const minutes = String(createTime.getMinutes()).padStart(2, '0')
    const seconds = String(createTime.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
router.post('/dealerList', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const page = Number(req.body.page) || 1
    const pageSize = Number(req.body.pageSize) || 10
    const offset = (page - 1) * pageSize
    try {
        const [countRows] = await db.query(
            'SELECT COUNT(*) AS total FROM dealer'
        )
        const total = countRows[0].total
        const [results] = await db.query(
            'SELECT * FROM dealer ORDER BY No DESC LIMIT ?, ?',
            [offset, pageSize]
        )
        results.forEach((dealer) => {
            dealer.createdAt = formatDate(dealer.createdAt)
            dealer.endDate = formatDate(dealer.endDate)
        })
        res.json({
            status: 200,
            msg: '获取经销商列表成功',
            data: results,
            total,
        })
    } catch (err) {
        console.error('获取经销商列表失败:', err)
        res.status(500).json({
            status: 500,
            msg: '获取经销商列表失败',
            error: err.message,
        })
    }
})

// 新增申报记录接口
router.post('/addDealer', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const {
        dealerName,
        contactPerson,
        contactPhone,
        address,
        startDate,
        endDate,
    } = req.body
    try {
        const [result] = await db.query(
            'INSERT INTO dealer (dealerName, contactPerson, contactPhone, address, startDate, endDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [
                dealerName,
                contactPerson,
                contactPhone,
                address,
                startDate,
                endDate,
            ]
        )
        res.json({
            status: 200,
            msg: '新增经销商记录成功',
            data: { insertId: result.insertId },
        })
    } catch (err) {
        console.error('新增经销商记录失败:', err)
        res.status(500).json({
            status: 500,
            msg: '新增经销商记录失败',
            error: err.message,
        })
    }
})

module.exports = router
