const express = require('express')
const router = express.Router()

const usersRouter = require('./modelApi/user')
const systemRouter = require('./modelApi/system')
const goodsRouter = require('./modelApi/goods')

router.use('/users', usersRouter)
router.use('/system', systemRouter)
router.use('/goods', goodsRouter)

module.exports = router
