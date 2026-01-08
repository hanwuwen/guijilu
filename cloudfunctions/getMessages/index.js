// getMessages/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 获取对话的消息记录
exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const { conversationId, limit = 20, offset = 0 } = event
    
    // 验证用户是否是对话参与者
    const conversation = await db.collection('conversations')
      .where({ _id: conversationId })
      .get()
    
    if (conversation.data.length === 0) {
      return {
        success: false,
        error: '对话不存在'
      }
    }
    
    if (!conversation.data[0].participants.includes(openid)) {
      return {
        success: false,
        error: '无权访问此对话'
      }
    }
    
    // 获取消息记录
    const messages = await db.collection('messages')
      .where({ conversationId })
      .orderBy('createdAt', 'desc')
      .skip(offset)
      .limit(limit)
      .get()
    
    // 处理消息数据，添加发送者信息
    const processedMessages = await Promise.all(messages.data.map(async (message) => {
      if (message.senderOpenid) {
        const sender = await db.collection('users')
          .where({ openid: message.senderOpenid })
          .field({ nickName: true, avatarUrl: true })
          .get()
        
        if (sender.data.length > 0) {
          return {
            ...message,
            senderInfo: sender.data[0]
          }
        }
      }
      return message
    }))
    
    // 标记消息为已读
    await db.collection('conversations')
      .where({ _id: conversationId })
      .update({
        data: { unreadCount: 0 }
      })
    
    // 更新消息的已读状态
    await db.collection('messages')
      .where({ 
        conversationId, 
        'readStatus.' + openid: false 
      })
      .update({
        data: {
          ['readStatus.' + openid]: true
        }
      })
    
    return {
      success: true,
      messages: processedMessages.reverse() // 反转消息顺序，使最早的消息在前
    }
  } catch (error) {
    console.error('获取消息记录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
