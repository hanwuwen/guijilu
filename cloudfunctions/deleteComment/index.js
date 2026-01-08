// deleteComment/index.js
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
        error: '权限不足，只有管理员可以删除评论'
      }
    }
    
    const { commentId } = event
    
    // 验证参数
    if (!commentId) {
      return {
        success: false,
        error: '缺少必要参数'
      }
    }
    
    // 检查评论是否存在
    const commentResult = await db.collection('comments').where({ _id: commentId }).get()
    if (!commentResult.data[0]) {
      return {
        success: false,
        error: '评论不存在'
      }
    }
    
    // 删除评论
    await db.collection('comments').doc(commentId).remove()
    
    return {
      success: true,
      message: '评论删除成功'
    }
  } catch (error) {
    console.error('删除评论失败:', error)
    return {
      success: false,
      error: '删除评论失败'
    }
  }
}