const express = require('express')
const router = express.Router()

router.get('/system', (req, res) => {
    // 状态200
    res.status(200).json({
        message: '系统信息接口',
        data: {
            name: 'My Express App',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            port: process.env.PORT || 3000,
        },
    })
})
module.exports = router
