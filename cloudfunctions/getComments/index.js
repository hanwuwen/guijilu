// getComments/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { activityId } = event

    // 获取评论列表，按创建时间倒序
    const res = await db.collection('comments')
      .where({ activityId })
      .orderBy('createdAt', 'desc')
      .get()

    return {
      success: true,
      comments: res.data
    }
  } catch (error) {
    console.error('获取评论失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}