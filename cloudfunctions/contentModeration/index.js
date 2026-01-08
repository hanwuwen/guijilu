// contentModeration/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 违规内容检测模块
class ContentModeration {
  constructor(sensitiveWords, regexRules) {
    // 敏感词列表
    this.sensitiveWords = sensitiveWords || []
    // 正则表达式规则
    this.regexRules = regexRules || {
      // 默认规则
      phone: /1[3-9]\d{9}/g,
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      qq: /[qQ][qQ][\s:：]*[1-9]\d{4,}/g,
      wechat: /[微v][信x][号h][\s:：]*[a-zA-Z0-9_-]{6,}/g,
      url: /https?:\/\/[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/g
    }
  }

  // 检测文本内容
  detect(content) {
    if (!content || typeof content !== 'string') {
      return {
        passed: true,
        violations: []
      }
    }

    const violations = []

    // 检测敏感词
    this.sensitiveWords.forEach(word => {
      if (content.includes(word)) {
        violations.push({
          type: 'sensitive_word',
          message: `包含敏感词: ${word}`
        })
      }
    })

    // 检测正则表达式匹配
    for (const [type, regex] of Object.entries(this.regexRules)) {
      const matches = content.match(regex)
      if (matches) {
        violations.push({
          type: 'personal_info',
          message: `包含个人信息: ${type}`
        })
      }
    }

    return {
      passed: violations.length === 0,
      violations
    }
  }

  // 过滤违规内容（替换为***）
  filter(content) {
    if (!content || typeof content !== 'string') {
      return content
    }

    let filteredContent = content

    // 过滤敏感词
    this.sensitiveWords.forEach(word => {
      const regex = new RegExp(word, 'g')
      filteredContent = filteredContent.replace(regex, '***')
    })

    // 过滤个人信息
    for (const [type, regex] of Object.entries(this.regexRules)) {
      filteredContent = filteredContent.replace(regex, '***')
    }

    return filteredContent
  }
}

// 加载审核数据
async function loadModerationData() {
  try {
    // 加载敏感词
    const wordsResult = await db.collection('sensitiveWords').get()
    const sensitiveWords = wordsResult.data.map(item => item.word)

    // 加载正则表达式规则
    const rulesResult = await db.collection('moderationRules').get()
    const regexRules = {}
    rulesResult.data.forEach(rule => {
      try {
        const parts = rule.pattern.match(/^\/(.*)\/(\w*)$/)
        if (parts) {
          const [, pattern, flags] = parts
          regexRules[rule.name] = new RegExp(pattern, flags)
        }
      } catch (e) {
        console.error('解析规则失败:', rule.name, e)
      }
    })

    return { sensitiveWords, regexRules }
  } catch (error) {
    console.error('加载审核数据失败:', error)
    // 返回默认数据
    return {
      sensitiveWords: ['敏感词1', '敏感词2', '色情词1', '暴力词1', '违法词1', '广告词1'],
      regexRules: {
        phone: /1[3-9]\d{9}/g,
        email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        qq: /[qQ][qQ][\s:：]*[1-9]\d{4,}/g,
        wechat: /[微v][信x][号h][\s:：]*[a-zA-Z0-9_-]{6,}/g,
        url: /https?:\/\/[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/g
      }
    }
  }
}

// 导出检测函数
exports.main = async (event, context) => {
  try {
    const { content, action = 'detect' } = event
    
    // 加载审核数据
    const moderationData = await loadModerationData()
    const moderator = new ContentModeration(moderationData.sensitiveWords, moderationData.regexRules)

    if (action === 'detect') {
      return {
        success: true,
        result: moderator.detect(content)
      }
    } else if (action === 'filter') {
      return {
        success: true,
        result: moderator.filter(content)
      }
    } else {
      return {
        success: false,
        error: 'Invalid action'
      }
    }
  } catch (error) {
    console.error('内容检测失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
