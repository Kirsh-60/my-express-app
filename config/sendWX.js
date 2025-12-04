const axios = require('axios')

// 获取 access_token（需定时刷新）
async function getAccessToken(appid, secret) {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`
    const res = await axios.get(url)
    console.log('获取 access_token:', res.data)
    return res.data.access_token
}
// 发送模板消息
async function sendTemplateMsg(access_token, openid, template_id, data) {
    const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${access_token}`
    const body = {
        touser: openid,
        template_id,
        data,
    }
    const res = await axios.post(url, body)
    return res.data
}

// 推送消息给指定 openid
async function pushToOneUser(appid, secret, openid, template_id, data) {
    try {
        const access_token = await getAccessToken(appid, secret)
        const result = await sendTemplateMsg(access_token, openid, template_id, data)
        console.log(`推送给 ${openid}:`, result)
        return result
    } catch (err) {
        console.error(`推送失败 ${openid}:`, err.response?.data || err.message)
        throw err
    }
}

const DEFAULT_OPENID = 'oNCZ85Hd8vk99m_obp2F2uk0cj60'

async function pushToDefaultUser(appid, secret, template_id, data) {
    try {
        const access_token = await getAccessToken(appid, secret)
        const result = await sendTemplateMsg(access_token, DEFAULT_OPENID, template_id, data)
        console.log(`推送给 ${DEFAULT_OPENID}:`, result)
        return result
    } catch (err) {
        console.error(`推送失败 ${DEFAULT_OPENID}:`, err.response?.data || err.message)
        throw err
    }
}

module.exports = {
    getAccessToken,
    sendTemplateMsg,
    pushToOneUser,
    pushToDefaultUser,
}
