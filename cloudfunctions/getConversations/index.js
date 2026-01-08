// getConversations/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 获取用户的对话列表
exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    
    // 查询用户参与的所有对话
    const conversations = await db.collection('conversations')
      .where({
        participants: db.command.includes(openid)
      })
      .orderBy('lastMessageTime', 'desc')
      .get()
    
    // 处理对话列表数据
    const processedConversations = await Promise.all(conversations.data.map(async (conversation) => {
      // 获取最后一条消息
      const lastMessage = await db.collection('messages')
        .where({ conversationId: conversation._id })
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get()
      
      // 获取其他参与者信息
      let otherParticipants = []
      if (conversation.type === 'single') {
        // 单聊：获取对方用户信息
        const otherOpenid = conversation.participants.find(p => p !== openid)
        if (otherOpenid) {
          const userInfo = await db.collection('users')
            .where({ openid: otherOpenid })
            .field({ nickName: true, avatarUrl: true })
            .get()
          if (userInfo.data.length > 0) {
            otherParticipants = [{ ...userInfo.data[0], openid: otherOpenid }]
          }
        }
      } else if (conversation.type === 'group') {
        // 群聊：获取所有其他参与者信息
        const otherOpenids = conversation.participants.filter(p => p !== openid)
        if (otherOpenids.length > 0) {
          const usersInfo = await db.collection('users')
            .where({
              openid: db.command.in(otherOpenids)
            })
            .field({ nickName: true, avatarUrl: true })
            .get()
          otherParticipants = usersInfo.data.map(user => ({ ...user, openid: user.openid }))
        }
      }
      
      return {
        ...conversation,
        lastMessage: lastMessage.data[0] || null,
        otherParticipants,
        unreadCount: conversation.unreadCount || 0
      }
    }))
    
    return {
      success: true,
      conversations: processedConversations
    }
  } catch (error) {
    console.error('获取对话列表失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
