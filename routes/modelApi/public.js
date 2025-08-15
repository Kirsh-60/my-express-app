const express = require('express')
const multer = require('multer')
const path = require('path')
const crypto = require('crypto') // 用于计算文件哈希值
const fs = require('fs')
const router = express.Router()

// 配置 multer 存储选项
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 设置上传文件存储的文件夹为服务器绝对路径
    const uploadDir = '/var/www/images'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // 设置文件名，使用时间戳 + 原始文件名
    const uniqueSuffix = Date.now() + '-' + file.originalname
    cb(null, uniqueSuffix)
  },
})

// 创建 multer 实例
const upload = multer({ storage })

// 上传图片接口
router.post('/uploadImgs', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(200).json({
      code: -1,
      msg: '未上传文件',
    })
  }

  // 计算文件的哈希值
  const fileBuffer = fs.readFileSync(req.file.path)
  const hash = crypto.createHash('md5').update(fileBuffer).digest('hex')
  const existingFilePath = path.join(
    '/var/www/images',
    `${hash}-${req.file.originalname}`
  )

  // 检查是否已有相同文件
  if (fs.existsSync(existingFilePath)) {
    // 删除当前上传的重复文件
    fs.unlinkSync(req.file.path)
    return res.json({
      code: 200,
      data: {
        imageUrl: `https://blackbuy.asia/images/${hash}-${req.file.originalname}`,
      },
    })
  }

  // 如果没有重复文件，重命名文件为哈希值命名
  fs.renameSync(req.file.path, existingFilePath)

  res.json({
    code: 200,
    msg: '图片上传成功',
    data: {
      imageUrl: `https://blackbuy.asia/images/${hash}-${req.file.originalname}`,
    },
  })
})

module.exports = router