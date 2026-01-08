// getActivityListAdmin/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    
    // 首先检查调用者是否为管理员
    const adminResult = await db.collection('users').where({ openid }).get()
    if (adminResult.data.length === 0 || !adminResult.data[0].admin) {
      return {
        success: false,
        error: '权限不足，只有管理员可以查看活动列表'
      }
    }
    
    // 获取活动列表，支持分页和筛选
    const { page = 1, pageSize = 20, status = '' } = event
    const skip = (page - 1) * pageSize
    
    let query = db.collection('activities')
    
    // 如果指定了状态，进行筛选
    if (status) {
      query = query.where({ status })
    }
    
    const activityResult = await query
      .skip(skip)
      .limit(pageSize)
      .orderBy('createdAt', 'desc')
      .get()
    
    const totalResult = await db.collection('activities').count()
    
    return {
      success: true,
      activities: activityResult.data,
      total: totalResult.total,
      page,
      pageSize
    }
  } catch (error) {
    console.error('获取活动列表失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}