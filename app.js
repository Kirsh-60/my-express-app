require('dotenv').config()
const db = require('./config/db')

const express = require('express')
const session = require('express-session')
const morgan = require('morgan')
const helmet = require('helmet')
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const path = require('path')
const app = express()

const jwt = require('jsonwebtoken')
// 安全相关中间件
app.use(helmet())

// 跨域支持
app.use(
    cors({
        origin: (origin, callback) => callback(null, true),
        credentials: true, // 允许跨域携带 Cookie
    })
)

// 日志记录
app.use(morgan('dev'))

// 解析请求体
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Cookie解析
app.use(cookieParser())

// 静态文件服务
app.use(express.static('public'))

// 会话中间件，必须在任何使用 req.session 的路由前
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'change_this_secret', // 用于加密 session ID 的字符串，建议使用环境变量存储
        resave: false, // 是否在每次请求时强制保存 session，建议设置为 false
        saveUninitialized: false, // 是否在未初始化的 session 存储到数据库，建议设置为 false
        captcha: '', // 验证码存储在 session 中
        cookie: {
            secure: process.env.NODE_ENV === 'production', // HTTPS 时设为 true
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 1000 * 60 * 30, // 30 分钟
        },
    })
)

// 启动前测试 MySQL 连接
;(async () => {
    try {
        const conn = await db.getConnection()
        console.log('✔ MySQL 已连接')
        conn.release()
    } catch (err) {
        console.error('✖ MySQL 连接失败：', err)
        process.exit(1)
    }
})()

// 路由设置
const apiRouter = require('./routes/api')

// 定义 JWT 白名单接口，无需认证
const whiteList = [
    '/users/login', // 登录接口
    '/users/captcha', // 获取验证码接口
    '/users/register', //用户注册接口
    '/system/system', // 系统信息接口
    // 如需更多开放接口，按需添加
]

// JWT 验证中间件
const jwtAuth = (req, res, next) => {
    // 白名单路径直接放行
    console.log('请求路径：', req.path)
    if (whiteList.includes(req.path) || req.path.startsWith('/wechat/')) {
        console.log('跳过认证，访问白名单接口：', req.path)
        return next()
    }
    const token =
        req.Token ||
        req.cookies.token ||
        req.headers.authorization?.split(' ')[1]
    console.log('JWT 验证中间件：', token)
    if (!token) {
        return res.status(401).json({ error: '登录过期，请重新登录' })
    }
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET) // 使用环境变量中的 JWT 密钥
        console.log('JWT 验证成功，用户信息：', req.user)
        next()
    } catch (err) {
        res.clearCookie('token')
        return res.status(401).json({ error: '登录过期，请重新登录' })
    }
}

// 应用 JWT 中间件到 /api 路由
app.use('/api', jwtAuth, apiRouter)

// ----------------- 上传图片 -----------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ----------------- 全局响应格式化 -----------------
// 将所有正常的 res.json(xxx) 自动变成 { code:200, data:xxx }
app.use((req, res, next) => {
    const _json = res.json.bind(res)
    res.json = (payload) => {
        // 如果 payload 本身包含 code，认为已经是自定义返回，直接发出
        if (
            payload &&
            typeof payload === 'object' &&
            payload.code !== undefined
        ) {
            return _json(payload)
        }
        return _json({ code: 200, data: payload })
    }
    next()
})
// 全局异常拦截，返回 code = -1
app.use((err, req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    )
    res.status(500).json({
        code: -1,
        error: err.message || 'Internal Server Error',
        data: null,
    })
})

// 启动服务器
const PORT = 3000
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://81.70.28.17:${PORT}`)
})
