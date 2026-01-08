// saveCertificate/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const { activityId } = event

    if (!activityId) {
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

    // 检查用户是否已经完成所有打卡
    const checkinsResult = await db.collection('checkins')
      .where({ activityId, openid })
      .get()

    if (checkinsResult.data.length < activity.checkpoints.length) {
      return {
        success: false,
        error: '未完成所有打卡，无法获得证书'
      }
    }

    // 更新用户的证书记录
    await db.collection('users').where({ openid }).update({
      data: {
        certificates: _.addToSet({
          activityId,
          activityName: activity.name,
          certificateDate: new Date()
        })
      }
    })

    return {
      success: true,
      message: '证书保存成功'
    }
  } catch (error) {
    console.error('保存证书记录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}