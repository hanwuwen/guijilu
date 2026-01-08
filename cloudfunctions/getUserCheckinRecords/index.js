// getUserCheckinRecords/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 获取当前用户的openid
    const { OPENID } = cloud.getWXContext()

    // 查询用户的打卡记录
    const checkinRecords = await db.collection('checkins')
      .where({ userId: OPENID })
      .orderBy('createdAt', 'desc')
      .get()

    // 处理打卡记录，获取相关的活动信息
    const records = await Promise.all(
      checkinRecords.data.map(async (checkin) => {
        // 获取活动信息
        const activityRes = await db.collection('activities')
          .doc(checkin.activityId)
          .get()

        const activity = activityRes.data
        const checkpoint = activity.checkpoints[checkin.checkpointIndex]

        return {
          _id: checkin._id,
          activityId: checkin.activityId,
          activityName: activity.name,
          checkpointName: checkpoint.name,
          checkinDate: new Date(checkin.createdAt).toISOString().split('T')[0],
          note: checkin.note,
          images: checkin.images || [],
          locationName: checkin.location?.name || checkpoint.location?.name || '未知位置'
        }
      })
    )

    return {
      success: true,
      records
    }
  } catch (error) {
    console.error('获取打卡记录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
