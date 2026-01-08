// updateUserInfo/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const { userInfo } = event

    if (!userInfo) {
      return {
        success: false,
        error: '参数不完整'
      }
    }

    // 更新用户信息
    await db.collection('users').where({ openid }).update({
      data: {
        ...userInfo,
        updatedAt: new Date()
      }
    })

    return {
      success: true,
      message: '用户信息更新成功'
    }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}