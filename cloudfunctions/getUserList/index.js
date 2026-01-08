// getUserList/index.js
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
        error: '权限不足，只有管理员可以查看用户列表'
      }
    }
    
    // 获取用户列表，支持分页
    const { page = 1, pageSize = 20 } = event
    const skip = (page - 1) * pageSize
    
    const userResult = await db.collection('users')
      .skip(skip)
      .limit(pageSize)
      .orderBy('createdAt', 'desc')
      .get()
    
    const totalResult = await db.collection('users').count()
    
    return {
      success: true,
      users: userResult.data,
      total: totalResult.total,
      page,
      pageSize
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}