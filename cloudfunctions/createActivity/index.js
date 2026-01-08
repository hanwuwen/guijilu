// createActivity/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const { name, description, city, startDate, endDate, coverImage, checkpoints } = event

    // 验证参数
    if (!name || !description || !city || !startDate || !endDate || !checkpoints || checkpoints.length === 0) {
      return {
        success: false,
        error: '参数不完整'
      }
    }

    // 验证打卡点数量
    if (checkpoints.length > 20) {
      return {
        success: false,
        error: '打卡点数量不能超过20个'
      }
    }

    // 创建活动
    const activity = {
      name,
      description,
      city,
      startDate,
      endDate,
      coverImage,
      checkpoints,
      creator: openid,
      participants: [openid],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('activities').add({ data: activity })

    return {
      success: true,
      activityId: result._id
    }
  } catch (error) {
    console.error('创建活动失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}