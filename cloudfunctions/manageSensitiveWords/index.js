// manageSensitiveWords/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { action, data } = event
    
    // 验证管理员权限
    const { openid } = cloud.getWXContext()
    const adminResult = await db.collection('users').where({ openid }).get()
    if (!adminResult.data[0] || !adminResult.data[0].admin) {
      return {
        success: false,
        error: '权限不足，只有管理员可以管理敏感词'
      }
    }

    switch (action) {
      case 'add':
        return await addSensitiveWord(data)
      case 'delete':
        return await deleteSensitiveWord(data)
      case 'update':
        return await updateSensitiveWord(data)
      case 'list':
        return await listSensitiveWords(data)
      case 'addRule':
        return await addRule(data)
      case 'deleteRule':
        return await deleteRule(data)
      case 'updateRule':
        return await updateRule(data)
      case 'listRules':
        return await listRules(data)
      default:
        return {
          success: false,
          error: '无效的操作'
        }
    }
  } catch (error) {
    console.error('管理敏感词失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 添加敏感词
async function addSensitiveWord(data) {
  const { word, category } = data
  
  if (!word || !category) {
    return {
      success: false,
      error: '缺少必要参数'
    }
  }

  // 检查是否已存在
  const existing = await db.collection('sensitiveWords').where({ word }).get()
  if (existing.data.length > 0) {
    return {
      success: false,
      error: '敏感词已存在'
    }
  }

  const result = await db.collection('sensitiveWords').add({
    data: {
      word,
      category,
      createdAt: new Date()
    }
  })

  return {
    success: true,
    wordId: result._id
  }
}

// 删除敏感词
async function deleteSensitiveWord(data) {
  const { wordId } = data
  
  if (!wordId) {
    return {
      success: false,
      error: '缺少必要参数'
    }
  }

  await db.collection('sensitiveWords').doc(wordId).remove()

  return {
    success: true,
    message: '敏感词删除成功'
  }
}

// 更新敏感词
async function updateSensitiveWord(data) {
  const { wordId, word, category } = data
  
  if (!wordId) {
    return {
      success: false,
      error: '缺少必要参数'
    }
  }

  const updateData = {}
  if (word) updateData.word = word
  if (category) updateData.category = category
  updateData.updatedAt = new Date()

  await db.collection('sensitiveWords').doc(wordId).update({
    data: updateData
  })

  return {
    success: true,
    message: '敏感词更新成功'
  }
}

// 获取敏感词列表
async function listSensitiveWords(data) {
  const { category, page = 1, pageSize = 20 } = data
  
  let query = db.collection('sensitiveWords')
  if (category) {
    query = query.where({ category })
  }

  const total = await query.count()
  const words = await query
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  return {
    success: true,
    total: total.total,
    words: words.data
  }
}

// 添加规则
async function addRule(data) {
  const { name, pattern, description } = data
  
  if (!name || !pattern) {
    return {
      success: false,
      error: '缺少必要参数'
    }
  }

  // 检查是否已存在
  const existing = await db.collection('moderationRules').where({ name }).get()
  if (existing.data.length > 0) {
    return {
      success: false,
      error: '规则已存在'
    }
  }

  const result = await db.collection('moderationRules').add({
    data: {
      name,
      pattern,
      description,
      createdAt: new Date()
    }
  })

  return {
    success: true,
    ruleId: result._id
  }
}

// 删除规则
async function deleteRule(data) {
  const { ruleId } = data
  
  if (!ruleId) {
    return {
      success: false,
      error: '缺少必要参数'
    }
  }

  await db.collection('moderationRules').doc(ruleId).remove()

  return {
    success: true,
    message: '规则删除成功'
  }
}

// 更新规则
async function updateRule(data) {
  const { ruleId, name, pattern, description } = data
  
  if (!ruleId) {
    return {
      success: false,
      error: '缺少必要参数'
    }
  }

  const updateData = {}
  if (name) updateData.name = name
  if (pattern) updateData.pattern = pattern
  if (description) updateData.description = description
  updateData.updatedAt = new Date()

  await db.collection('moderationRules').doc(ruleId).update({
    data: updateData
  })

  return {
    success: true,
    message: '规则更新成功'
  }
}

// 获取规则列表
async function listRules(data) {
  const rules = await db.collection('moderationRules')
    .orderBy('createdAt', 'desc')
    .get()

  return {
    success: true,
    rules: rules.data
  }
}