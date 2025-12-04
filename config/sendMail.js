const nodemailer = require('nodemailer')
const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>财务确认单</title>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 24px; }
        h2 { color: #2d8cf0; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f7fa; }
        .footer { margin-top: 24px; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>财务确认单</h2>
        <p>尊敬的财务人员，您好：</p>
        <p>请确认以下款项信息：</p>
        <table>
            <tr>
                <th>项目</th>
                <th>金额</th>
                <th>备注</th>
            </tr>
            <tr>
                <td>服务费</td>
                <td>¥2,000.00</td>
                <td>2025年12月服务</td>
            </tr>
            <tr>
                <td>材料费</td>
                <td>¥500.00</td>
                <td>办公用品采购</td>
            </tr>
        </table>
        <p>如有疑问请及时联系。</p>
        <div class="footer">
            此邮件由系统自动发送，请勿直接回复。<br>
            财务部<br>
            2025年12月3日
        </div>
    </div>
</body>
</html>`
async function sendMail(to, subject) {
    // 配置邮箱服务（以QQ邮箱为例，其他邮箱请查找对应SMTP配置）
    let transporter = nodemailer.createTransport({
        host: 'smtp.qq.com',
        port: 465,
        secure: true,
        auth: {
            user: '3314934166@qq.com',
            pass: 'ocokcthrroivcigi', // 授权码
        },
    })

    let info = await transporter.sendMail({
        from: '"刘宁" <3314934166@qq.com>', // 发件人地址
        to,
        subject,
        html,
    })

    console.log('邮件发送成功: %s', info.messageId)
}

module.exports = sendMail
