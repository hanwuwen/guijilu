// getUserInfo/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    
    // 尝试从数据库获取用户信息
    const userResult = await db.collection('users').where({ openid }).get()
    
    if (userResult.data.length > 0) {
      return {
        success: true,
        userInfo: userResult.data[0]
      }
    } else {
      // 如果用户不存在，创建一个新用户记录
      const newUser = {
        openid,
        nickname: '城市漫游者',
        avatarUrl: 'https://via.placeholder.com/100',
        createdAt: new Date(),
        certificates: [],
        level: 1,
        exp: 0,
        totalCheckins: 0,
        totalActivities: 0,
        lastLevelUpdate: new Date(),
        admin: false
      }
      
      await db.collection('users').add({ data: newUser })
      
      return {
        success: true,
        userInfo: newUser
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}