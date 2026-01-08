// sendMessage/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 发送消息
exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const { conversationId, content, type = 'text' } = event
    
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
    
    // 检测违规内容（仅文本消息）
    if (type === 'text' && content) {
      const contentModeration = await cloud.callFunction({
        name: 'contentModeration',
        data: { content }
      })

      if (!contentModeration.result.success || !contentModeration.result.result.passed) {
        return {
          success: false,
          error: '消息内容包含违规内容'
        }
      }
    }
    
    // 生成消息记录
    const message = {
      conversationId,
      senderOpenid: openid,
      content,
      type,
      createdAt: new Date(),
      readStatus: {},
      moderationStatus: 'passed'
    }
    
    // 初始化未读状态
    conversation.data[0].participants.forEach(participant => {
      message.readStatus[participant] = participant === openid
    })
    
    // 保存消息
    const result = await db.collection('messages').add({
      data: message
    })
    
    // 更新对话的最后消息时间和未读计数
    const unreadCount = conversation.data[0].unreadCount || 0
    await db.collection('conversations')
      .where({ _id: conversationId })
      .update({
        data: {
          lastMessageTime: new Date(),
          unreadCount: unreadCount + 1
        }
      })
    
    // 发送订阅消息通知
    try {
      // 获取接收消息的用户（除了发送者自己）
      const recipients = conversation.data[0].participants.filter(p => p !== openid)
      
      // 为每个接收者发送订阅消息
      for (const recipientOpenid of recipients) {
        // 获取发送者信息
        const senderInfo = await db.collection('users')
          .where({ openid })
          .field({ nickName: true, avatarUrl: true })
          .get()
        
        if (senderInfo.data.length > 0) {
          // 发送订阅消息
          await cloud.openapi.subscribeMessage.send({
            touser: recipientOpenid,
            templateId: 'TEMPLATE_ID', // 需要在小程序后台配置订阅消息模板
            page: `pages/chat/chat?conversationId=${conversationId}&type=${conversation.data[0].type}&name=${conversation.data[0].name}`,
            data: {
              thing1: {
                value: senderInfo.data[0].nickName || '用户'
              },
              thing2: {
                value: content.length > 20 ? content.substring(0, 20) + '...' : content
              },
              time3: {
                value: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
              }
            }
          })
        }
      }
    } catch (error) {
      console.error('发送订阅消息失败:', error)
      // 订阅消息发送失败不影响消息发送
    }
    
    return {
      success: true,
      messageId: result._id
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
