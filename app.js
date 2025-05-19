require('dotenv').config()
const db = require('./config/db')

const express = require('express')
const session = require('express-session')
const morgan = require('morgan')
const helmet = require('helmet')
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const app = express()

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
      secure: true, // 如果上线了 HTTPS，可改为 true
      sameSite: 'lax', // 允许跨站点携带 // 开发阶段用 lax 或 strict
      maxAge: 1000 * 60 * 30, // 30 分钟
    },
  })
)
app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`)
  }
  next()
})
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

// ----------------- 全局响应格式化 -----------------
// 将所有正常的 res.json(xxx) 自动变成 { code:200, data:xxx }
app.use((req, res, next) => {
  const _json = res.json.bind(res)
  res.json = (payload) => {
    // 如果 payload 本身包含 code，认为已经是自定义返回，直接发出
    if (payload && typeof payload === 'object' && payload.code !== undefined) {
      return _json(payload)
    }
    return _json({ code: 200, data: payload })
  }
  next()
})

// 路由设置
const indexRouter = require('./routes/index')
const apiRouter = require('./routes/api')
app.use('/', indexRouter)
app.use('/api', apiRouter)

// // 404 统一返回 code = -1
// app.use((req, res) => {
//   res.json({ code: -1, message: 'Not Found' })
// })

// 全局异常拦截，返回 code = -1
app.use((err, req, res, next) => {
  console.error(err)
  res.json({ code: -1, message: err.message || 'Internal Server Error' })
})

// 启动服务器
const PORT = 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://81.70.28.17:${PORT}`)
})
