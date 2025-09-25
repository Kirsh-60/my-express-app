const express = require('express')
const router = express.Router()

router.get('/bills', (req, res) => {
    // 状态200
    res.status(200).json({
        status: 200,
        message: '系统信息接口',
        data: {
            name: 'My Express App',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            port: process.env.PORT || 3000,
        },
    })
})
router.get('/info', (req, res) => {
    // 状态200
    res.set('Cache-Control', 'no-store')
    res.status(200).json({
        status: 200,
        message: 'React 专用接口',
        data: {
            path: [
                {
                    key: '1',
                    icon: 'UserOutlined',
                    label: '首页',
                    url: '/',
                },
                {
                    key: 'sub1',
                    icon: 'LaptopOutlined',
                    label: '用户1',
                    children: [
                        {
                            key: '2',
                            label: 'Tom',
                            url: '/user/tom', // 修改为 /user
                        },
                        {
                            key: '3',
                            label: 'Bill',
                            url: '/user/bill',
                        },
                    ],
                },
                {
                    key: 'sub2',
                    icon: 'NotificationOutlined',
                    label: '用户2',
                    children: [
                        {
                            key: '4',
                            label: 'Tom2',
                            url: '/user/tom2',
                        },
                        {
                            key: '5',
                            label: 'Bill2',
                            url: '/user/bill2',
                        },
                    ],
                },
            ],
            userInfo: {
                name: 'React User',
                age: 30,
                email: '',
                role: 'admin',
                permissions: ['read', 'write', 'execute'],
                avatar: 'https://www.example.com/avatar.png',
                phone: '123-456-7890',
                address: '123 React St, JavaScript City, Web',
            },
        },
    })
})

router.get('/statisticList', (req, res) => {
    // 状态200
    res.set('Cache-Control', 'no-store')
    res.status(200).json({
        status: 200,
        message: '统计列表接口',
        data: [
            {
                title: 'Active',
                value: 11.28,
                precision: 2,
                valueStyle: { color: '#3f8600' },
                prefix: 'up',
                suffix: '%',
            },
            {
                title: 'Idle',
                value: 9.3,
                precision: 2,
                valueStyle: { color: '#cf1322' },
                prefix: 'down',
                suffix: '%',
            },
            {
                title: 'Active',
                value: 11.28,
                precision: 2,
                valueStyle: { color: '#3f8600' },
                prefix: 'up',
                suffix: '%',
            },
            {
                title: 'Idle',
                value: 9.3,
                precision: 2,
                valueStyle: { color: '#cf1322' },
                prefix: 'down',
                suffix: '%',
            },
        ],
        echartData: {
            option1: {
                xAxis: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                series: [5, 20, 36, 10, 10, 20, 15],
            },
            option2: {
                xAxis: [
                    '1月',
                    '2月',
                    '3月',
                    '4月',
                    '5月',
                    '6月',
                    '7月',
                    '8月',
                    '9月',
                    '10月',
                    '11月',
                    '12月',
                ],
                seriesBar: [
                    6, 32, 70, 86, 68.7, 100.7, 125.6, 112.2, 78.7, 48.8, 36.0,
                    19.3,
                ],
                seriesLine: [
                    6.0, 10.2, 10.3, 11.5, 10.3, 13.2, 14.3, 16.4, 18.0, 16.5,
                    12.0, 5.2,
                ],
            },
        },
        queryData: {
            data: [
                {
                    key: '1',
                    name: 'John Brown',
                    age: 32,
                    address: 'New York No. 1 Lake Park',
                    tags: ['nice', 'developer'],
                },
                {
                    key: '2',
                    name: 'Jim Green',
                    age: 42,
                    address: 'London No. 1 Lake Park',
                    tags: ['loser'],
                },
                {
                    key: '3',
                    name: 'Joe Black',
                    age: 32,
                    address: 'Sidney No. 1 Lake Park',
                    tags: ['cool', 'teacher'],
                },
            ],
        },
    })
})
// 获取用户列表 从Tom表里获取，支持分页
router.post('/userlist', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const db = require('../../config/db')
    const page = Number(req.body.page) || 1
    const pageSize = Number(req.body.pageSize) || 10
    const offset = (page - 1) * pageSize
    const name = req.body.name || ''

    try {
        // 1. 查总数
        let countSql = 'SELECT COUNT(*) AS total FROM Tom'
        let countParams = []
        if (name) {
            countSql += ' WHERE name LIKE ?'
            countParams.push(`%${name}%`)
        }
        const [countResult] = await db.query(countSql, countParams)
        const total = countResult[0].total

        // 2. 查分页数据
        let dataSql = 'SELECT * FROM Tom'
        let dataParams = []
        if (name) {
            dataSql += ' WHERE name LIKE ?'
            dataParams.push(`%${name}%`)
        }
        dataSql += ' ORDER BY createTime DESC LIMIT ?, ?'
        dataParams.push(Number(offset), Number(pageSize))

        const [results] = await db.query(dataSql, dataParams)

        res.json({
            status: 200,
            message: '获取用户列表成功',
            data: {
                list: results,
                total,
            },
        })
    } catch (err) {
        console.error('数据库查询出错:', err)
        res.status(500).json({ error: err.message })
    }
})
// 往Tom表里添加用户
router.post('/adduser', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const db = require('../../config/db')
    const { name, age, address } = req.body
    const createTime = new Date()
    if (!name || !age || !address) {
        return res.status(400).json({
            status: 400,
            message: '缺少必要的用户信息',
            data: null,
        })
    }
    try {
        const sql =
            'INSERT INTO Tom (name, age, address, createTime) VALUES (?, ?, ?, ?)'
        const params = [name, age, address, createTime]
        const [result] = await db.query(sql, params)
        res.json({
            status: 200,
            message: '添加用户成功',
            data: { id: result.insertId, name, age, address },
        })
    } catch (err) {
        console.error('数据库插入出错:', err)
        res.status(500).json({ error: err.message })
    }
})
// 删除Tom表里的用户
router.post('/deleteuser', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const db = require('../../config/db')
    const { id } = req.body
    if (!id) {
        return res.status(400).json({
            status: 400,
            message: '缺少用户ID',
            data: null,
        })
    }
    try {
        const sql = 'DELETE FROM Tom WHERE id = ?'
        const params = [id]
        const [result] = await db.query(sql, params)
        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 404,
                message: '用户不存在',
                data: null,
            })
        }
        res.json({
            status: 200,
            message: '删除用户成功',
            data: { id },
        })
    } catch (err) {
        console.error('数据库删除出错:', err)
        res.status(500).json({ error: err.message })
    }
})
// 编辑Tom表里的用户
router.post('/edituser', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const db = require('../../config/db')
    const { id, name, age, address } = req.body
    if (!id || !name || !age || !address) {
        return res.status(400).json({
            status: 400,
            message: '缺少必要的用户信息',
            data: null,
        })
    }
    try {
        const sql = 'UPDATE Tom SET name = ?, age = ?, address = ? WHERE id = ?'
        const params = [name, age, address, id]
        const [result] = await db.query(sql, params)
        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 404,
                message: '用户不存在',
                data: null,
            })
        }
        res.json({
            status: 200,
            message: '编辑用户成功',
            data: { id, name, age, address },
        })
    } catch (err) {
        console.error('数据库更新出错:', err)
        res.status(500).json({ error: err.message })
    }
})
module.exports = router
