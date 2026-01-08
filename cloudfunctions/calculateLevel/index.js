// calculateLevel/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 等级配置
const levelConfig = [
  { level: 1, minExp: 0, maxExp: 99, name: '漫游新手', color: '#999999', icon: '🌱' },
  { level: 2, minExp: 100, maxExp: 299, name: '漫游探索者', color: '#66CCFF', icon: '🧭' },
  { level: 3, minExp: 300, maxExp: 599, name: '漫游达人', color: '#9966FF', icon: '🏃' },
  { level: 4, minExp: 600, maxExp: 999, name: '漫游精英', color: '#FF9966', icon: '🌟' },
  { level: 5, minExp: 1000, maxExp: 1499, name: '漫游大师', color: '#FF6666', icon: '🏆' },
  { level: 6, minExp: 1500, maxExp: 2999, name: '漫游专家', color: '#FF66B2', icon: '💎' },
  { level: 7, minExp: 3000, maxExp: 4999, name: '漫游传奇', color: '#9933FF', icon: '⚡' },
  { level: 8, minExp: 5000, maxExp: 7999, name: '漫游神话', color: '#FF3366', icon: '🔥' },
  { level: 9, minExp: 8000, maxExp: 11999, name: '漫游圣徒', color: '#FFCC00', icon: '👑' },
  { level: 10, minExp: 12000, maxExp: 999999, name: '漫游王者', color: '#FF6600', icon: '👑' }
]

// 计算用户等级
exports.calculateUserLevel = (exp) => {
  for (let i = levelConfig.length - 1; i >= 0; i--) {
    if (exp >= levelConfig[i].minExp) {
      return levelConfig[i]
    }
  }
  return levelConfig[0]
}

// 云函数主入口
exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    
    // 获取用户当前数据
    const userResult = await db.collection('users').where({ openid }).get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      }
    }
    
    const user = userResult.data[0]
    const { totalCheckins = 0, totalActivities = 0 } = user
    
    // 计算经验值
    // 每次打卡 +10 经验，每个活动 +20 经验
    const exp = totalCheckins * 10 + totalActivities * 20
    
    // 计算等级
    const levelInfo = exports.calculateUserLevel(exp)
    
    // 更新用户等级信息
    await db.collection('users').where({ openid }).update({
      data: {
        level: levelInfo.level,
        exp,
        lastLevelUpdate: new Date()
      }
    })
    
    return {
      success: true,
      levelInfo,
      exp
    }
  } catch (error) {
    console.error('计算等级失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
