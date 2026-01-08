// createConversation/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 创建对话
exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const { participants, type = 'single', name = '' } = event
    
    // 验证参与者列表
    if (!participants || participants.length < 1) {
      return {
        success: false,
        error: '参与者不能为空'
      }
    }
    
    // 确保当前用户在参与者列表中
    if (!participants.includes(openid)) {
      participants.push(openid)
    }
    
    // 对于单聊，确保只有两个参与者
    if (type === 'single' && participants.length !== 2) {
      return {
        success: false,
        error: '单聊只能有两个参与者'
      }
    }
    
    // 检查是否已存在相同的单聊对话
    if (type === 'single') {
      const existingConversation = await db.collection('conversations')
        .where({
          type: 'single',
          participants: db.command.all(participants).and(db.command.size(2))
        })
        .get()
      
      if (existingConversation.data.length > 0) {
        return {
          success: true,
          conversationId: existingConversation.data[0]._id
        }
      }
    }
    
    // 创建新对话
    const conversation = {
      participants,
      type,
      name: type === 'group' ? name : '',
      createdAt: new Date(),
      lastMessageTime: new Date(),
      unreadCount: 0
    }
    
    // 保存对话
    const result = await db.collection('conversations').add({
      data: conversation
    })
    
    return {
      success: true,
      conversationId: result._id
    }
  } catch (error) {
    console.error('创建对话失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
