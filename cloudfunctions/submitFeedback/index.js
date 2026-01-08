// submitFeedback/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 获取用户信息
    const { OPENID } = cloud.getWXContext()
    const userResult = await db.collection('users').where({ openid: OPENID }).get()
    
    let userId = OPENID
    let userName = '匿名用户'
    
    if (userResult.data && userResult.data.length > 0) {
      const user = userResult.data[0]
      userId = user._id
      userName = user.nickName || userName
    }
    
    // 验证输入参数
    const { content, type, contact } = event
    
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return {
        success: false,
        error: '反馈内容不能为空'
      }
    }
    
    if (content.length > 500) {
      return {
        success: false,
        error: '反馈内容不能超过500字'
      }
    }
    
    if (!type || typeof type !== 'string') {
      return {
        success: false,
        error: '请选择反馈类型'
      }
    }
    
    // 检测违规内容
    const contentModeration = await cloud.callFunction({
      name: 'contentModeration',
      data: { content: content.trim() }
    })
    
    if (!contentModeration.result.success || !contentModeration.result.result.passed) {
      return {
        success: false,
        error: '反馈内容包含违规内容'
      }
    }
    
    // 构建反馈数据
    const feedbackData = {
      userId,
      userName,
      content: content.trim(),
      type,
      contact: contact ? contact.trim() : '',
      createdAt: new Date(),
      status: 'pending',
      readAt: null,
      reply: '',
      repliedAt: null
    }
    
    // 存储反馈数据
    const result = await db.collection('feedback').add({
      data: feedbackData
    })
    
    return {
      success: true,
      feedbackId: result._id
    }
  } catch (error) {
    console.error('提交反馈失败:', error)
    return {
      success: false,
      error: '提交失败，请稍后重试'
    }
  }
}