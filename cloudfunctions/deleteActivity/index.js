// deleteActivity/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const { activityId } = event
    
    // 首先检查调用者是否为管理员
    const adminResult = await db.collection('users').where({ openid }).get()
    if (adminResult.data.length === 0 || !adminResult.data[0].admin) {
      return {
        success: false,
        error: '权限不足，只有管理员可以删除活动'
      }
    }
    
    // 检查活动是否存在
    const activityResult = await db.collection('activities').where({ _id: activityId }).get()
    if (activityResult.data.length === 0) {
      return {
        success: false,
        error: '活动不存在'
      }
    }
    
    // 删除活动
    await db.collection('activities').doc(activityId).remove()
    
    // 这里可以添加删除活动相关的其他数据，例如活动的评论、参与记录等
    // 例如：await db.collection('comments').where({ activityId }).remove()
    
    return {
      success: true,
      message: '活动删除成功'
    }
  } catch (error) {
    console.error('删除活动失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}