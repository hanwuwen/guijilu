// getActivityList/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { query = '' } = event
    const openid = cloud.getWXContext().OPENID

    // 构建查询条件
    let whereCondition = {}
    if (query) {
      whereCondition = {
        ...whereCondition,
        name: db.RegExp({ regexp: query, options: 'i' })
      }
    }

    // 查询活动列表
    const result = await db.collection('activities')
      .where(whereCondition)
      .orderBy('createdAt', 'desc')
      .get()

    return {
      success: true,
      activities: result.data
    }
  } catch (error) {
    console.error('获取活动列表失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}