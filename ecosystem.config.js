module.exports = {
  apps: [
    {
      name: 'my-express-app',
      script: './app.js',
      cwd: __dirname,
      watch: ['app.js', 'routes', 'config'], // 监控热重载，可按需调整
      env_file: '.env', // 明确指定 .env 文件
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
      },
      // 添加错误和输出日志配置
      error_file: './logs/app-error.log',
      out_file: './logs/app-out.log',
      log_file: './logs/app-combined.log',
      time: true,
    },
  ],
}
