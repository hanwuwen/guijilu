// addComment/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { activityId, content } = event
    const wxContext = cloud.getWXContext()

    // 检测违规内容
    const contentModeration = await cloud.callFunction({
      name: 'contentModeration',
      data: { content }
    })

    if (!contentModeration.result.success || !contentModeration.result.result.passed) {
      return {
        success: false,
        error: '评论内容包含违规内容'
      }
    }

    // 获取用户信息
    const userRes = await db.collection('users').where({ openid: wxContext.OPENID }).get()
    const userInfo = userRes.data[0] || { openid: wxContext.OPENID, userInfo: {} }

    // 创建评论
    const commentData = {
      activityId,
      content,
      userInfo: userInfo.userInfo || {},
      openid: wxContext.OPENID,
      likes: 0,
      createdAt: new Date().toISOString(),
      moderationStatus: 'passed'
    }

    const res = await db.collection('comments').add({ data: commentData })

    return {
      success: true,
      commentId: res._id
    }
  } catch (error) {
    console.error('添加评论失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}