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
// 菜单
router.get('/info', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const db = require('../../config/db')
    // 假设 userId 从请求头或 query 获取
    const userId = req.headers['userid'] || req.query.userId
    if (!userId) {
        return res.status(401).json({
            status: 401,
            message: '缺少用户身份信息',
            data: null,
        })
    }
    try {
        // 查询用户角色
        const [userRows] = await db.query(
            'SELECT username, role FROM user WHERE id = ?',
            [userId]
        )
        if (userRows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: '用户不存在',
                data: null,
            })
        }
        const roleId = userRows[0].role
        const username = userRows[0].username
        // 查询角色的菜单权限
        const [roleRows] = await db.query(
            'SELECT menu_permissions FROM role WHERE id = ?',
            [roleId]
        )
        if (roleRows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: '角色不存在',
                data: null,
            })
        }
        // debug输出原始menu_permissions
        console.log('role.menu_permissions:', roleRows[0].menu_permissions)
        let menuKeys = []
        const rawMenuPermissions = roleRows[0].menu_permissions
        if (Array.isArray(rawMenuPermissions)) {
            menuKeys = rawMenuPermissions
        } else {
            try {
                menuKeys = JSON.parse(rawMenuPermissions || '[]')
            } catch (e) {
                menuKeys = []
            }
        }
        if (!Array.isArray(menuKeys)) {
            menuKeys = []
        }
        if (menuKeys.length === 0) {
            return res.status(200).json({
                status: 200,
                message: '该角色未绑定菜单',
                data: {
                    path: [],
                    userInfo: { name: username, role: roleId },
                    debug: { menuKeys, raw: rawMenuPermissions },
                },
            })
        }
        // 查询菜单表，获取这些 key 的菜单
        const [menuRows] = await db.query(
            `SELECT * FROM menu WHERE menu_key IN (${menuKeys
                .map(() => '?')
                .join(',')}) ORDER BY sort ASC, id ASC`,
            menuKeys
        )
        if (menuRows.length === 0) {
            return res.status(200).json({
                status: 200,
                message: '该角色未绑定菜单（无匹配菜单项）',
                data: {
                    path: [],
                    userInfo: { name: username, role: roleId },
                    debug: { menuKeys, menuRows },
                },
            })
        }
        // 构建树形结构
        function buildTree(list, parentId = null, parentKey = null) {
            return list
                .filter((item) => item.parent_id === parentId)
                .map((item) => {
                    const children = buildTree(list, item.id, item.menu_key)
                    const node = {
                        key: item.menu_key,
                        icon: item.icon,
                        label: item.label,
                        url: item.url,
                        parentKey: parentKey,
                        sort: item.sort,
                    }
                    if (children.length > 0) node.children = children
                    return node
                })
        }
        const menuTree = buildTree(menuRows)
        res.status(200).json({
            status: 200,
            message: 'React 专用接口',
            data: {
                path: menuTree,
                userInfo: {
                    name: username,
                    role: roleId,
                },
            },
        })
    } catch (err) {
        console.error('数据库查询出错:', err)
        res.status(500).json({ error: err.message })
    }
})
// ...existing code...
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
// 获取用户列表 从user表里获取，支持分页
router.post('/userlist', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const db = require('../../config/db')
    const page = Number(req.body.page) || 1
    const pageSize = Number(req.body.pageSize) || 10
    const offset = (page - 1) * pageSize
    const name = req.body.username || ''

    try {
        // 1. 查总数
        let countSql = 'SELECT COUNT(*) AS total FROM user'
        let countParams = []
        if (name) {
            countSql += ' WHERE username LIKE ?'
            countParams.push(`%${name}%`)
        }
        const [countResult] = await db.query(countSql, countParams)
        const total = countResult[0].total

        // 2. 查分页数据，联表查角色名
        let dataSql = `
            SELECT u.*, r.name AS rolename
            FROM user u
            LEFT JOIN role r ON u.role = r.id
        `
        let dataParams = []
        if (name) {
            dataSql += ' WHERE u.username LIKE ?'
            dataParams.push(`%${name}%`)
        }
        dataSql += ' ORDER BY u.age DESC LIMIT ?, ?'
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
    const { name, age, address, role } = req.body
    const createTime = new Date()
    if (!name || age === undefined || age === null || !address) {
        return res.status(400).json({
            status: 400,
            message: '缺少必要的用户信息',
            data: null,
        })
    }
    try {
        const sql =
            'INSERT INTO user (username, age, address, role, createTime) VALUES (?, ?, ?, ?, ?)'
        const params = [name, age, address, role ?? null, createTime]
        const [result] = await db.query(sql, params)
        if (!result || result.affectedRows !== 1) {
            return res.status(500).json({
                status: 500,
                message: '添加用户失败',
                data: null,
            })
        }
        res.json({
            status: 200,
            message: '添加用户成功',
            data: { id: result.insertId, name, age, address, role: role ?? null },
        })
    } catch (err) {
        console.error('数据库插入出错:', err)
        res.status(500).json({ error: err.message })
    }
})
// 删除user表里的用户
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
        const sql = 'DELETE FROM user WHERE id = ?'
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
// 编辑user表里的用户
router.post('/edituser', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const db = require('../../config/db')
    const { id, username, age, address, role } = req.body
    if (!id || !username || !age || !address || !role) {
        return res.status(400).json({
            status: 400,
            message: '缺少必要的用户信息',
            data: null,
        })
    }
    try {
        const sql =
            'UPDATE user SET username = ?, age = ?, role = ?, address = ? WHERE id = ?'
        const params = [username, age, role, address, id]
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
            data: { id, username, age, address, role },
        })
    } catch (err) {
        console.error('数据库更新出错:', err)
        res.status(500).json({ error: err.message })
    }
})
// 编辑菜单接口
router.post('/editmenu', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const db = require('../../config/db')
    const { label, url, icon, key, parentKey } = req.body
    if (!label || !url || !icon || !key) {
        return res.status(400).json({
            status: 400,
            message: '缺少必要的菜单信息',
            data: null,
        })
    }
    try {
        // 查询是否存在该菜单项
        const [rows] = await db.query('SELECT * FROM menu WHERE menu_key = ?', [
            key,
        ])
        if (rows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: '菜单项不存在',
                data: null,
            })
        }
        // 更新菜单项
        const sql =
            'UPDATE menu SET label = ?, url = ?, icon = ?, parent_id = ? WHERE menu_key = ?'
        // parent_id 需要通过 parentKey 查询对应 id，如果 parentKey 为 null，则 parent_id 设为 null
        let parentId = null
        if (parentKey) {
            const [parentRows] = await db.query(
                'SELECT id FROM menu WHERE menu_key = ?',
                [parentKey]
            )
            if (parentRows.length > 0) {
                parentId = parentRows[0].id
            }
        }
        await db.query(sql, [label, url, icon, parentId, key])
        res.json({
            status: 200,
            message: '编辑菜单成功',
            data: { label, url, icon, key, parentKey },
        })
    } catch (err) {
        console.error('数据库菜单编辑出错:', err)
        res.status(500).json({ error: err.message })
    }
})
// 新增一级菜单
router.post('/addmenufirst', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const db = require('../../config/db')
    const { label, url, icon } = req.body
    if (!label || !url || !icon) {
        return res.status(404).json({
            status: 404,
            message: '缺少必要的菜单信息',
            data: null,
        })
    }
    try {
        // 新增一级菜单，parent_id 设为 null，sort 设为当前最大 sort + 1
        const [maxSortRows] = await db.query(
            'SELECT MAX(sort) AS maxSort FROM menu'
        )
        const maxSort = maxSortRows[0].maxSort || 0
        // 生成唯一 menu_key
        const menuKey = `${label}_${Date.now()}`
        const sql =
            'INSERT INTO menu (label, url, icon, parent_id, sort, menu_key) VALUES (?, ?, ?, NULL, ?, ?)'
        const params = [label, url, icon, maxSort + 1, menuKey]
        const [result] = await db.query(sql, params)
        res.json({
            status: 200,
            message: '新增一级菜单成功',
            data: { id: result.insertId, label, url, icon, menu_key: menuKey },
        })
    } catch (err) {
        console.error('数据库插入菜单出错:', err)
        res.status(500).json({ error: err.message })
    }
})
// 添加下级菜单，parentKey 指定上级菜单
router.post('/addmenulower', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const db = require('../../config/db')
    const { label, url, icon, parentKey } = req.body
    if (!label || !url || !icon || !parentKey) {
        return res.status(404).json({
            status: 404,
            message: '缺少必要的菜单信息',
            data: null,
        })
    }
    try {
        // 通过 parentKey 查询对应 id
        const [parentRows] = await db.query(
            'SELECT id FROM menu WHERE menu_key = ?',
            [parentKey]
        )
        if (parentRows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: '上级菜单不存在',
                data: null,
            })
        }
        const parentId = parentRows[0].id
        // 新增下级菜单，sort 设为当前同级最大 sort + 1
        const [maxSortRows] = await db.query(
            'SELECT MAX(sort) AS maxSort FROM menu WHERE parent_id = ?',
            [parentId]
        )
        const maxSort = maxSortRows[0].maxSort || 0
        // 生成唯一 menu_key
        const menuKey = `${label}_${Date.now()}`
        const sql =
            'INSERT INTO menu (label, url, icon, parent_id, sort, menu_key) VALUES (?, ?, ?, ?, ?, ?)'
        const params = [label, url, icon, parentId, maxSort + 1, menuKey]
        const [result] = await db.query(sql, params)
        res.json({
            status: 200,
            message: '新增下级菜单成功',
            data: {
                id: result.insertId,
                label,
                url,
                icon,
                menu_key: menuKey,
                parentKey,
            },
        })
    } catch (err) {
        console.error('数据库插入下级菜单出错:', err)
        res.status(500).json({ error: err.message })
    }
})
// 根据key删除菜单
router.get('/deletemenu', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const db = require('../../config/db')
    // 修改为从 req.query 获取 key
    const { key } = req.query
    if (!key) {
        return res.status(404).json({
            status: 404,
            message: '缺少菜单key',
            data: null,
        })
    }
    try {
        // 1. 查询是否存在该菜单项
        const [rows] = await db.query('SELECT * FROM menu WHERE menu_key = ?', [
            key,
        ])
        if (rows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: '菜单项不存在',
                data: null,
            })
        }
        const menuId = rows[0].id
        // 2. 删除该菜单及其所有子菜单
        const deleteMenuAndChildren = async (id) => {
            // 先删除子菜单
            const [childRows] = await db.query(
                'SELECT id FROM menu WHERE parent_id = ?',
                [id]
            )
            for (const child of childRows) {
                await deleteMenuAndChildren(child.id)
            }
            // 然后删除当前菜单
            await db.query('DELETE FROM menu WHERE id = ?', [id])
        }
        await deleteMenuAndChildren(menuId)
        res.json({
            status: 200,
            message: '删除菜单成功',
            data: { key },
        })
    } catch (err) {
        console.error('数据库删除菜单出错:', err)
        res.status(500).json({ error: err.message })
    }
})
// 获取完整的菜单树
router.get('/menutree', async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const db = require('../../config/db')
    try {
        const [menuRows] = await db.query(
            'SELECT * FROM menu ORDER BY sort ASC, id ASC'
        )
        if (menuRows.length === 0) {
            return res.status(200).json({
                status: 200,
                message: '当前无菜单项',
                data: { path: [] },
            })
        }
        // 构建树形结构
        function buildTree(list, parentId = null, parentKey = null) {
            return list
                .filter((item) => item.parent_id === parentId)
                .map((item) => {
                    const children = buildTree(list, item.id, item.menu_key)
                    const node = {
                        key: item.menu_key,
                        icon: item.icon,
                        label: item.label,
                        url: item.url,
                        parentKey: parentKey,
                        sort: item.sort,
                    }
                    if (children.length > 0) node.children = children
                    return node
                })
        }
        const menuTree = buildTree(menuRows)
        res.status(200).json({
            status: 200,
            message: '获取菜单树成功',
            data: { path: menuTree },
        })
    } catch (err) {
        console.error('数据库查询菜单树出错:', err)
        res.status(500).json({ error: err.message })
    }
})
module.exports = router
