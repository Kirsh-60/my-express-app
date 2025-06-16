const express = require('express')
const router = express.Router()

const usersRouter = require('./modelApi/user')
const systemRouter = require('./modelApi/system')
const goodsRouter = require('./modelApi/goods')
const publicRouter = require('./modelApi/public')
const mockRouter = require('./modelApi/mock')

router.use('/users', usersRouter)
router.use('/system', systemRouter)
router.use('/goodsList', goodsRouter)
router.use('/public', publicRouter)
router.use('/mock', mockRouter)

module.exports = router
