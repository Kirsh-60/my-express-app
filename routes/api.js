const express = require('express')
const router = express.Router()

const usersRouter = require('./modelApi/user')
const systemRouter = require('./modelApi/system')
const goodsRouter = require('./modelApi/goods')
const publicRouter = require('./modelApi/public')
const wxappRouter = require('./wechat/user')
const reactRouter = require('./react/index')
const reactRoleRouter = require('./react/role')
const dealerRouter = require('./react/dealer')

// 经销商相关接口

router.use('/users', usersRouter)
router.use('/system', systemRouter)
router.use('/goodsList', goodsRouter)
router.use('/public', publicRouter)
router.use('/wechat', wxappRouter)
router.use('/react', reactRouter)
router.use('/react', reactRoleRouter)
router.use('/react', dealerRouter)

module.exports = router
