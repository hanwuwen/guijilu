// getUserReports/index.js
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
        error: '权限不足，只有管理员可以查看举报信息'
      }
    }
    
    const { skip = 0, limit = 20, status = '' } = event
    
    // 构建查询条件
    let query = db.collection('reports')
    if (status) {
      query = query.where({ status })
    }
    
    // 按创建时间倒序获取举报信息
    const result = await query
      .skip(skip)
      .limit(limit)
      .orderBy('createdAt', 'desc')
      .get()
    
    // 为每个举报信息添加用户和被举报用户的信息
    const reports = await Promise.all(result.data.map(async (report) => {
      // 获取举报用户信息
      const reporterResult = await db.collection('users').where({ openid: report.reporterOpenid }).get()
      const reporterInfo = reporterResult.data[0] || { nickname: '未知用户' }
      
      // 获取被举报用户信息
      const reportedResult = await db.collection('users').where({ openid: report.reportedOpenid }).get()
      const reportedInfo = reportedResult.data[0] || { nickname: '未知用户' }
      
      // 获取被举报内容信息（如果有）
      let contentInfo = null
      if (report.contentType === 'activity' && report.contentId) {
        const activityResult = await db.collection('activities').where({ _id: report.contentId }).get()
        contentInfo = activityResult.data[0] || null
      } else if (report.contentType === 'comment' && report.contentId) {
        const commentResult = await db.collection('comments').where({ _id: report.contentId }).get()
        contentInfo = commentResult.data[0] || null
      }
      
      return {
        ...report,
        reporterInfo: {
          nickname: reporterInfo.nickname,
          avatarUrl: reporterInfo.avatarUrl
        },
        reportedInfo: {
          nickname: reportedInfo.nickname,
          avatarUrl: reportedInfo.avatarUrl
        },
        contentInfo
      }
    }))
    
    return {
      success: true,
      data: reports
    }
  } catch (error) {
    console.error('获取用户举报信息失败:', error)
    return {
      success: false,
      error: '获取举报信息失败'
    }
  }
}