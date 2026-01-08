// initModeration/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 创建敏感词集合
    try {
      await db.createCollection('sensitiveWords')
      console.log('敏感词集合创建成功')
    } catch (e) {
      console.log('敏感词集合已存在')
    }

    // 创建规则集合
    try {
      await db.createCollection('moderationRules')
      console.log('规则集合创建成功')
    } catch (e) {
      console.log('规则集合已存在')
    }

    // 添加初始敏感词
    const initialSensitiveWords = [
      // 政治敏感词
      { word: '敏感政治词', category: '政治', createdAt: new Date() },
      { word: '敏感人物', category: '政治', createdAt: new Date() },
      { word: '敏感事件', category: '政治', createdAt: new Date() },
      { word: '颠覆国家', category: '政治', createdAt: new Date() },
      { word: '分裂祖国', category: '政治', createdAt: new Date() },
      
      // 色情相关词
      { word: '色情', category: '色情', createdAt: new Date() },
      { word: '黄色', category: '色情', createdAt: new Date() },
      { word: '淫秽', category: '色情', createdAt: new Date() },
      { word: '色情图片', category: '色情', createdAt: new Date() },
      { word: '色情视频', category: '色情', createdAt: new Date() },
      { word: '裸照', category: '色情', createdAt: new Date() },
      { word: '性爱', category: '色情', createdAt: new Date() },
      { word: '卖淫', category: '色情', createdAt: new Date() },
      { word: '嫖娼', category: '色情', createdAt: new Date() },
      { word: '艳照', category: '色情', createdAt: new Date() },
      
      // 暴力相关词
      { word: '暴力', category: '暴力', createdAt: new Date() },
      { word: '血腥', category: '暴力', createdAt: new Date() },
      { word: '杀人', category: '暴力', createdAt: new Date() },
      { word: '自杀', category: '暴力', createdAt: new Date() },
      { word: '自残', category: '暴力', createdAt: new Date() },
      { word: '打架', category: '暴力', createdAt: new Date() },
      { word: '斗殴', category: '暴力', createdAt: new Date() },
      { word: '伤害', category: '暴力', createdAt: new Date() },
      { word: '虐待', category: '暴力', createdAt: new Date() },
      { word: '暴力视频', category: '暴力', createdAt: new Date() },
      
      // 赌博相关词
      { word: '赌博', category: '赌博', createdAt: new Date() },
      { word: '赌场', category: '赌博', createdAt: new Date() },
      { word: '赌钱', category: '赌博', createdAt: new Date() },
      { word: '博彩', category: '赌博', createdAt: new Date() },
      { word: '彩票', category: '赌博', createdAt: new Date() },
      { word: '下注', category: '赌博', createdAt: new Date() },
      { word: '赌局', category: '赌博', createdAt: new Date() },
      { word: '赌球', category: '赌博', createdAt: new Date() },
      { word: '赌马', category: '赌博', createdAt: new Date() },
      { word: '网上赌博', category: '赌博', createdAt: new Date() },
      
      // 毒品相关词
      { word: '毒品', category: '毒品', createdAt: new Date() },
      { word: '海洛因', category: '毒品', createdAt: new Date() },
      { word: '冰毒', category: '毒品', createdAt: new Date() },
      { word: '大麻', category: '毒品', createdAt: new Date() },
      { word: '可卡因', category: '毒品', createdAt: new Date() },
      { word: '摇头丸', category: '毒品', createdAt: new Date() },
      { word: '吸毒', category: '毒品', createdAt: new Date() },
      { word: '贩毒', category: '毒品', createdAt: new Date() },
      { word: '制毒', category: '毒品', createdAt: new Date() },
      { word: '毒品交易', category: '毒品', createdAt: new Date() },
      
      // 广告相关词
      { word: '广告', category: '广告', createdAt: new Date() },
      { word: '推广', category: '广告', createdAt: new Date() },
      { word: '宣传', category: '广告', createdAt: new Date() },
      { word: '促销', category: '广告', createdAt: new Date() },
      { word: '优惠', category: '广告', createdAt: new Date() },
      { word: '折扣', category: '广告', createdAt: new Date() },
      { word: '特价', category: '广告', createdAt: new Date() },
      { word: '清仓', category: '广告', createdAt: new Date() },
      { word: '代购', category: '广告', createdAt: new Date() },
      { word: '代理', category: '广告', createdAt: new Date() },
      
      // 违法相关词
      { word: '违法', category: '违法', createdAt: new Date() },
      { word: '犯罪', category: '违法', createdAt: new Date() },
      { word: '盗窃', category: '违法', createdAt: new Date() },
      { word: '抢劫', category: '违法', createdAt: new Date() },
      { word: '诈骗', category: '违法', createdAt: new Date() },
      { word: '勒索', category: '违法', createdAt: new Date() },
      { word: '绑架', category: '违法', createdAt: new Date() },
      { word: '走私', category: '违法', createdAt: new Date() },
      { word: '偷税', category: '违法', createdAt: new Date() },
      { word: '漏税', category: '违法', createdAt: new Date() },
      
      // 其他违规词
      { word: '不良信息', category: '其他', createdAt: new Date() },
      { word: '垃圾信息', category: '其他', createdAt: new Date() },
      { word: '骚扰信息', category: '其他', createdAt: new Date() },
      { word: '诈骗信息', category: '其他', createdAt: new Date() },
      { word: '虚假信息', category: '其他', createdAt: new Date() },
      { word: '谣言', category: '其他', createdAt: new Date() },
      { word: '诽谤', category: '其他', createdAt: new Date() },
      { word: '侮辱', category: '其他', createdAt: new Date() },
      { word: '歧视', category: '其他', createdAt: new Date() },
      { word: '仇恨', category: '其他', createdAt: new Date() }
    ]

    for (const word of initialSensitiveWords) {
      await db.collection('sensitiveWords').add({ data: word })
    }

    // 添加初始规则
    const initialRules = [
      { name: 'phone', pattern: '/1[3-9]\\d{9}/g', description: '电话号码', createdAt: new Date() },
      { name: 'email', pattern: '/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g', description: '邮箱', createdAt: new Date() },
      { name: 'qq', pattern: '/[qQ][qQ][\\s:：]*[1-9]\\d{4,}/g', description: 'QQ号', createdAt: new Date() },
      { name: 'wechat', pattern: '/[微v][信x][号h][\\s:：]*[a-zA-Z0-9_-]{6,}/g', description: '微信号', createdAt: new Date() },
      { name: 'url', pattern: '/https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+([\\w\\-\\.,@?^=%&:/~\\+#]*[\\w\\-\\@?^=%&/~\\+#])?/g', description: '网址', createdAt: new Date() }
    ]

    for (const rule of initialRules) {
      await db.collection('moderationRules').add({ data: rule })
    }

    return {
      success: true,
      message: '违规内容管理初始化成功'
    }
  } catch (error) {
    console.error('初始化失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}