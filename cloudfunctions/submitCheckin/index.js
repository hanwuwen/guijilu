// submitCheckin/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const { activityId, checkpointIndex, note, images, location } = event

    // 验证参数
    if (!activityId || checkpointIndex === undefined || !location) {
      return {
        success: false,
        error: '参数不完整'
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
    const checkpoint = activity.checkpoints[checkpointIndex]

    if (!checkpoint) {
      return {
        success: false,
        error: '打卡点不存在'
      }
    }

    // 验证用户是否参与了活动
    if (!activity.participants || !activity.participants.includes(openid)) {
      return {
        success: false,
        error: '请先加入活动'
      }
    }

    // 验证位置距离（500米内）
    const distance = calculateDistance(
      location.latitude, location.longitude,
      checkpoint.location.latitude, checkpoint.location.longitude
    )

    if (distance > 500) {
      return {
        success: false,
        error: '距离打卡点过远，无法打卡'
      }
    }

    // 检查是否已经打卡过
    const existingCheckin = await db.collection('checkins')
      .where({
        activityId,
        openid,
        checkpointIndex
      })
      .get()

    if (existingCheckin.data.length > 0) {
      return {
        success: false,
        error: '已经打卡过该地点'
      }
    }

    // 创建打卡记录
    const checkin = {
      activityId,
      openid,
      checkpointIndex,
      checkpointName: checkpoint.name,
      note,
      images,
      location,
      distance,
      createdAt: new Date()
    }

    await db.collection('checkins').add({ data: checkin })

    return {
      success: true,
      message: '打卡成功'
    }
  } catch (error) {
    console.error('提交打卡失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 计算两点之间的距离（米）
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // 地球半径（米）
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}