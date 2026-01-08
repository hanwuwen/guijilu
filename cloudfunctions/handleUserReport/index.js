// handleUserReport/index.js
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
        error: '权限不足，只有管理员可以处理举报信息'
      }
    }
    
    const { reportId, action, reason } = event
    
    // 验证参数
    if (!reportId || !action) {
      return {
        success: false,
        error: '缺少必要参数'
      }
    }
    
    // 检查举报信息是否存在
    const reportResult = await db.collection('reports').where({ _id: reportId }).get()
    if (!reportResult.data[0]) {
      return {
        success: false,
        error: '举报信息不存在'
      }
    }
    
    const report = reportResult.data[0]
    
    // 根据操作类型处理举报
    if (action === 'accept') {
      // 处理被举报内容
      if (report.contentType === 'activity' && report.contentId) {
        // 删除违规活动
        await db.collection('activities').doc(report.contentId).remove()
      } else if (report.contentType === 'comment' && report.contentId) {
        // 删除违规评论
        await db.collection('comments').doc(report.contentId).remove()
      } else if (report.contentType === 'user' && report.reportedOpenid) {
        // 可以在这里添加对用户的处理逻辑，例如警告、禁言等
        // 这里暂时只记录处理状态
      }
      
      // 更新举报状态为已处理
      await db.collection('reports').doc(reportId).update({
        data: {
          status: 'processed',
          processedAt: new Date(),
          processedBy: openid,
          processReason: reason || '已处理违规内容'
        }
      })
    } else if (action === 'reject') {
      // 更新举报状态为驳回
      await db.collection('reports').doc(reportId).update({
        data: {
          status: 'rejected',
          processedAt: new Date(),
          processedBy: openid,
          processReason: reason || '举报不成立'
        }
      })
    } else {
      return {
        success: false,
        error: '无效的操作类型'
      }
    }
    
    return {
      success: true,
      message: '举报处理成功'
    }
  } catch (error) {
    console.error('处理用户举报失败:', error)
    return {
      success: false,
      error: '处理举报失败'
    }
  }
}