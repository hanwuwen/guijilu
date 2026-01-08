// getCommentsAdmin/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { openid } = cloud.getWXContext()
    
    // 验证用户是否为管理员
    const adminResult = await db.collection('users').where({ openid }).get()
    if (!adminResult.data[0] || !adminResult.data[0].admin) {
      return {
        success: false,
        error: '权限不足，只有管理员可以查看评论信息'
      }
    }
    
    const { skip = 0, limit = 20, activityId = '' } = event
    
    // 构建查询条件
    let query = db.collection('comments')
    if (activityId) {
      query = query.where({ activityId })
    }
    
    // 按创建时间倒序获取评论信息
    const result = await query
      .skip(skip)
      .limit(limit)
      .orderBy('createdAt', 'desc')
      .get()
    
    // 为每个评论添加用户信息
    const comments = await Promise.all(result.data.map(async (comment) => {
      // 获取评论用户信息
      const userResult = await db.collection('users').where({ openid: comment.openid }).get()
      const userInfo = userResult.data[0] || { nickname: '未知用户' }
      
      // 获取评论所属活动信息
      const activityResult = await db.collection('activities').where({ _id: comment.activityId }).get()
      const activityInfo = activityResult.data[0] || { title: '未知活动' }
      
      return {
        ...comment,
        userInfo: {
          nickname: userInfo.nickname,
          avatarUrl: userInfo.avatarUrl
        },
        activityInfo: {
          title: activityInfo.title
        }
      }
    }))
    
    return {
      success: true,
      data: comments
    }
  } catch (error) {
    console.error('获取评论信息失败:', error)
    return {
      success: false,
      error: '获取评论信息失败'
    }
  }
}