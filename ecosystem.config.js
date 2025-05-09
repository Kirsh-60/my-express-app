module.exports = {
  apps: [
    {
      name: 'my-express-app',
      script: './app.js',
      cwd: __dirname,
      watch: ['app.js', 'routes', 'config'], // 监控热重载，可按需调整
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
      },
    },
  ],
}
