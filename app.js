require('dotenv').config()
const db = require('./config/db')
const {
    redisClient,
    connectRedis,
    printRedisKey,
    setRedisKey,
} = require('./config/redis')
const express = require('express')
const cors = require('cors')
const session = require('express-session')
const morgan = require('morgan')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const path = require('path')
const app = express()
const sendWX = require('./config/sendWX')
// const sendMail = require('./config/sendMail');
// 针对带 credentials 的跨域请求配置 CORS
app.use(
    cors({
        origin: 'http://localhost:5173',
        credentials: true,
    })
)

// 获取redis连接
connectRedis(printRedisKey('mykey'), setRedisKey('INFO', 'testValue')).catch(
    (err) => {
        console.error('无法连接到Redis服务器:', err)
        process.exit(1)
    }
)

// 测试发送邮件
// sendMail('3314934166@qq.com', '测试', '这是一封测试邮件。').catch((err) => {
//     console.error('邮件发送失败:', err)
// });

const jwt = require('jsonwebtoken')
// 安全相关中间件
app.use(helmet())

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
app.use('/api', apiRouter)

// 定义 JWT 白名单接口，无需认证
const whiteList = [
    '/users/login', // 登录接口
    '/users/captcha', // 获取验证码接口
    '/users/register', //用户注册接口
    '/system/system', // 系统信息接口
    '/react/dealerList', // 经销商列表接口
    // '/react/bills', // React 系统信息接口
    // '/react/info', // React 系统信息接口
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

    // 修复token获取逻辑
    const token =
        req.Token ||
        req.cookies.token ||
        req.headers.token || // 添加从headers直接获取token
        (req.headers.authorization && req.headers.authorization.split(' ')[1])

    console.log('JWT 验证中间件 - Token获取结果:', {
        fromCookie: req.cookies.token
            ? `${req.cookies.token.substring(0, 20)}...`
            : null,
        fromHeader: req.headers.token
            ? `${req.headers.token.substring(0, 20)}...`
            : null,
        fromAuth: req.headers.authorization,
        finalToken: token ? `${token.substring(0, 20)}...` : null,
    })

    if (!token) {
        console.log('❌ 未找到token')
        return res.status(401).json({ error: '登录过期，请重新登录' })
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET)
        console.log('✅ JWT 验证成功，用户信息：', req.user)
        next()
    } catch (err) {
        console.error('❌ JWT 验证失败:', err.message)
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
    // 动态设置允许的 Origin
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, token'
    )
    res.header('Access-Control-Allow-Credentials', 'true')
    res.status(500).json({
        code: -1,
        error: err.message || 'Internal Server Error',
        data: null,
    })
})

// 启动服务器
const PORT = 3000
const os = require('os')
app.listen(PORT, '0.0.0.0', () => {
    // 获取本机局域网IP
    const interfaces = os.networkInterfaces()
    let lanIP = 'localhost'
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                lanIP = iface.address
                break
            }
        }
    }
    console.log(`Server is running on http://81.70.28.17:${PORT}`)
    console.log(`本机局域网访问地址: http://${lanIP}:${PORT}`)
})
