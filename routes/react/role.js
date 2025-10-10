const express = require('express')
const router = express.Router()
const dayjs = require('dayjs')

// 引入数据库连接
const db = require('../../config/db')
// 角色列表 数据库表 role
// 获取角色列表
router.post('/roleList', async (req, res) => {
    const page = Number(req.body.page) || 1
    const pageSize = Number(req.body.pageSize) || 10
    const offset = (page - 1) * pageSize
    const name = req.body.name || ''
    // const name = req.body.username || ''
    // console.log('name', name)
    try {
        // 1. 查总数
        let countSql = 'SELECT COUNT(*) AS total FROM role'
        let countParams = []
        if (name) {
            countSql += ' WHERE name LIKE ?'
            countParams.push(`%${name}%`)
        }
        const [countResult] = await db.query(countSql, countParams)
        const total = countResult[0].total
        // 2. 查分页数据
        let dataSql = 'SELECT * FROM role'
        let dataParams = []
        if (name) {
            dataSql += ' WHERE name LIKE ?'
            dataParams.push(`%${name}%`)
        }
        dataSql += ' ORDER BY createTime DESC LIMIT ?, ?'
        dataParams.push(offset, pageSize)
        const [dataResult] = await db.query(dataSql, dataParams)
        // 3. 返回结果
        const list = dataResult.map((item) => ({
            ...item,
            createTime: item.createTime
                ? dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss')
                : null,
        }))
        res.json({
            status: 200,
            msg: '获取角色列表成功',
            data: {
                list,
                total,
                page,
                pageSize,
            },
        })
    } catch (error) {
        console.error('获取角色列表失败:', error)
        res.status(500).json({
            code: 500,
            msg: '获取角色列表失败',
            error: error.message,
        })
    }
})
// 分配角色权限接口
router.post('/updatePermissions', async (req, res) => {
    const { id, roleList } = req.body
    if (!id || !Array.isArray(roleList)) {
        return res.status(400).json({ code: 400, msg: '参数错误' })
    }
    try {
        // 保存权限数组到 menu_permissions 字段（JSON 格式）
        await db.query('UPDATE role SET menu_permissions=? WHERE id=?', [
            JSON.stringify(roleList),
            id,
        ])
        res.json({ status: 200, msg: '权限分配成功' })
    } catch (error) {
        console.error('权限分配失败:', error)
        res.status(500).json({
            code: 500,
            msg: '权限分配失败',
            error: error.message,
        })
    }
})
// 新增角色接口
router.post('/addRole', async (req, res) => {
    const { name, description, roleList } = req.body
    if (!name || !Array.isArray(roleList)) {
        return res.status(404).json({ code: 404, msg: '参数错误' })
    }
    try {
        // 检查角色名是否已存在
        const [rows] = await db.query('SELECT id FROM role WHERE name=?', [
            name,
        ])
        if (rows.length > 0) {
            return res.status(404).json({ code: 404, msg: '角色名已存在' })
        }
        // 插入新角色
        await db.query(
            'INSERT INTO role (name, description, menu_permissions, createTime) VALUES (?, ?, ?, ?)',
            [
                name,
                description || '',
                JSON.stringify(roleList),
                dayjs().format('YYYY-MM-DD HH:mm:ss'),
            ]
        )
        res.json({ status: 200, msg: '新增角色成功' })
    } catch (error) {
        console.error('新增角色失败:', error)
        res.status(500).json({
            code: 500,
            msg: '新增角色失败',
            error: error.message,
        })
    }
})

// 编辑角色接口
router.post('/editRole', async (req, res) => {
    const { id, name, description, roleList } = req.body
    if (!id || !name || !Array.isArray(roleList)) {
        return res.status(400).json({ code: 400, msg: '参数错误' })
    }
    try {
        // 检查角色名是否已存在且不是当前角色
        const [rows] = await db.query(
            'SELECT id FROM role WHERE name=? AND id<>?',
            [name, id]
        )
        if (rows.length > 0) {
            return res.status(400).json({ code: 400, msg: '角色名已存在' })
        }
        // 更新角色信息
        await db.query(
            'UPDATE role SET name=?, description=?, menu_permissions=? WHERE id=?',
            [name, description || '', JSON.stringify(roleList), id]
        )
        res.json({ status: 200, msg: '编辑角色成功' })
    } catch (error) {
        console.error('编辑角色失败:', error)
        res.status(500).json({
            code: 500,
            msg: '编辑角色失败',
            error: error.message,
        })
    }
})
// 删除角色接口
router.post('/deleteRole', async (req, res) => {
    const { id } = req.body
    if (!id) {
        return res.status(400).json({ code: 400, msg: '参数错误' })
    }
    try {
        // 删除
        await db.query('DELETE FROM role WHERE id=?', [id])
        res.json({ status: 200, msg: '删除角色成功' })
    } catch (error) {
        console.error('删除角色失败:', error)
        res.status(500).json({
            code: 500,
            msg: '删除角色失败',
            error: error.message,
        })
    }
})
// 获取角色列表 不带分页
router.get('/allRoles', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name FROM role')
        res.json({ status: 200, msg: '获取角色列表成功', data: rows })
    } catch (error) {
        console.error('获取角色列表失败:', error)
        res.status(500).json({
            code: 500,
            msg: '获取角色列表失败',
            error: error.message,
        })
    }
})
module.exports = router
