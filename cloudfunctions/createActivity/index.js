// createActivity/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 等级对应的活动创建数量限制
const levelActivityLimits = {
  1: 3,   // 漫游新手: 3个活动
  2: 5,   // 漫游探索者: 5个活动
  3: 8,   // 漫游达人: 8个活动
  4: 12,  // 漫游精英: 12个活动
  5: 18,  // 漫游大师: 18个活动
  6: 25,  // 漫游专家: 25个活动
  7: 35,  // 漫游传奇: 35个活动
  8: 50,  // 漫游神话: 50个活动
  9: 70,  // 漫游圣徒: 70个活动
  10: 100 // 漫游王者: 100个活动
}

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

    // 获取用户信息
    const userResult = await db.collection('users').where({ openid }).get()
    if (userResult.data.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      }
    }

    const user = userResult.data[0]
    const userLevel = user.level || 1

    // 检查用户等级对应的活动创建限制
    const activityLimit = levelActivityLimits[userLevel] || 1

    // 查询用户已创建的活动数量
    const activityCountResult = await db.collection('activities')
      .where({ creator: openid })
      .count()

    const createdActivitiesCount = activityCountResult.total

    // 检查是否超过限制
    if (createdActivitiesCount >= activityLimit) {
      return {
        success: false,
        error: `您的等级为${userLevel}级，最多只能创建${activityLimit}个活动。当前已创建${createdActivitiesCount}个活动。`
      }
    }

    // 检测违规内容
    const nameModeration = await cloud.callFunction({
      name: 'contentModeration',
      data: { content: name }
    })

    if (!nameModeration.result.success || !nameModeration.result.result.passed) {
      return {
        success: false,
        error: '活动名称包含违规内容'
      }
    }

    const descriptionModeration = await cloud.callFunction({
      name: 'contentModeration',
      data: { content: description }
    })

    if (!descriptionModeration.result.success || !descriptionModeration.result.result.passed) {
      return {
        success: false,
        error: '活动描述包含违规内容'
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
      updatedAt: new Date(),
      moderationStatus: 'passed'
    }

    const result = await db.collection('activities').add({ data: activity })

    // 更新用户的总活动数
    await db.collection('users').where({ openid }).update({
      data: {
        totalActivities: _.inc(1)
      }
    })

    // 触发等级计算
    await cloud.callFunction({
      name: 'calculateLevel'
    })

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