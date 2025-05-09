const express = require('express')
const router = express.Router()

router.get('/system', (req, res) => {
  res.json([{ id: 1, name: 'John' }])
})
module.exports = router
