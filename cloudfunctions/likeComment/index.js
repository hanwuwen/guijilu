// likeComment/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { commentId } = event
    const wxContext = cloud.getWXContext()

    // 检查是否已经点赞
    const commentRes = await db.collection('comments').doc(commentId).get()
    const comment = commentRes.data

    if (!comment) {
      return { success: false, error: '评论不存在' }
    }

    // 切换点赞状态
    await db.collection('comments').doc(commentId).update({
      data: {
        likes: _.inc(1)
      }
    })

    return {
      success: true
    }
  } catch (error) {
    console.error('点赞评论失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}