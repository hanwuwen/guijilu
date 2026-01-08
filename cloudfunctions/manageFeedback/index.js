// manageFeedback/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    // 获取用户信息
    const { OPENID } = cloud.getWXContext()
    
    // 验证管理员权限
    const adminResult = await db.collection('users').where({ openid: OPENID }).get()
    if (!adminResult.data || adminResult.data.length === 0 || !adminResult.data[0].admin) {
      return {
        success: false,
        error: '权限不足，仅管理员可操作'
      }
    }
    
    const { action, feedbackId, status, reply } = event
    
    switch (action) {
      case 'getFeedbackList':
        // 获取反馈列表
        return await getFeedbackList(event)
      case 'markAsRead':
        // 标记为已读
        return await markAsRead(feedbackId)
      case 'replyFeedback':
        // 回复反馈
        return await replyFeedback(feedbackId, reply)
      case 'updateStatus':
        // 更新反馈状态
        return await updateStatus(feedbackId, status)
      default:
        return {
          success: false,
          error: '无效的操作类型'
        }
    }
  } catch (error) {
    console.error('处理反馈失败:', error)
    return {
      success: false,
      error: '操作失败，请稍后重试'
    }
  }
}

// 获取反馈列表
async function getFeedbackList(event) {
  const { page = 1, pageSize = 10, status } = event
  const skip = (page - 1) * pageSize
  
  let query = db.collection('feedback').orderBy('createdAt', 'desc')
  
  // 根据状态筛选
  if (status) {
    query = query.where({ status })
  }
  
  const result = await query.skip(skip).limit(pageSize).get()
  const totalResult = await db.collection('feedback').count()
  
  return {
    success: true,
    data: {
      feedbackList: result.data,
      total: totalResult.total,
      page,
      pageSize
    }
  }
}

// 标记为已读
async function markAsRead(feedbackId) {
  if (!feedbackId) {
    return {
      success: false,
      error: '反馈ID不能为空'
    }
  }
  
  await db.collection('feedback').doc(feedbackId).update({
    data: {
      status: 'read',
      readAt: new Date()
    }
  })
  
  return {
    success: true
  }
}

// 回复反馈
async function replyFeedback(feedbackId, reply) {
  if (!feedbackId || !reply) {
    return {
      success: false,
      error: '反馈ID和回复内容不能为空'
    }
  }
  
  await db.collection('feedback').doc(feedbackId).update({
    data: {
      reply,
      status: 'replied',
      repliedAt: new Date()
    }
  })
  
  return {
    success: true
  }
}

// 更新反馈状态
async function updateStatus(feedbackId, status) {
  if (!feedbackId || !status) {
    return {
      success: false,
      error: '反馈ID和状态不能为空'
    }
  }
  
  await db.collection('feedback').doc(feedbackId).update({
    data: {
      status
    }
  })
  
  return {
    success: true
  }
}