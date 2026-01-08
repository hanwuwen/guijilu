// joinActivity/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const { activityId } = event

    // 验证参数
    if (!activityId) {
      return {
        success: false,
        error: '活动ID不能为空'
      }
    }

    // 获取活动信息
    const activityResult = await db.collection('activities').doc(activityId).get()
    if (!activityResult.data) {
      return {
        success: false,
        error: '活动不存在'
      }
    }

    const activity = activityResult.data

    // 检查用户是否已经参与了活动
    if (activity.participants && activity.participants.includes(openid)) {
      return {
        success: true,
        message: '已经加入过该活动'
      }
    }

    // 更新活动参与者列表
    await db.collection('activities').doc(activityId).update({
      data: {
        participants: _.addToSet(openid),
        updatedAt: new Date()
      }
    })

    // 更新用户的总活动参与次数
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
      message: '加入活动成功'
    }
  } catch (error) {
    console.error('加入活动失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}