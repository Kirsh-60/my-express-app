const express = require('express')
const router = express.Router()

const usersRouter = require('./modelApi/user')
const systemRouter = require('./modelApi/system')

router.use('/users', usersRouter)
router.use('/system', systemRouter)

module.exports = router
