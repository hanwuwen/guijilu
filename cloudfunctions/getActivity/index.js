// getActivity/index.js
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
    
    // 检查用户是否参与了活动
    const isParticipant = activity.participants && activity.participants.includes(openid)
    
    // 获取用户的打卡记录
    let userCheckins = []
    let completedCheckpoints = 0

    if (isParticipant) {
      const checkinResult = await db.collection('checkins')
        .where({
          activityId,
          openid
        })
        .get()

      // 构建打卡状态数组
      userCheckins = activity.checkpoints.map((_, index) => {
        const hasCheckedIn = checkinResult.data.some(checkin => checkin.checkpointIndex === index)
        if (hasCheckedIn) completedCheckpoints++
        return hasCheckedIn
      })
    }

    return {
      success: true,
      activity,
      isParticipant,
      userCheckins,
      completedCheckpoints
    }
  } catch (error) {
    console.error('获取活动信息失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}