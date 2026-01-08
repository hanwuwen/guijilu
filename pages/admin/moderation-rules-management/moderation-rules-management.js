// moderation-rules-management.js
Page({
  data: {
    // 新规则表单
    newRule: {
      name: '',
      pattern: '',
      description: ''
    },
    
    // 搜索
    searchKeyword: '',
    
    // 规则列表
    rules: [],
    
    // 加载状态
    loading: false
  },

  onLoad() {
    this.loadModerationRules()
  },

  // 加载审核规则列表
  loadModerationRules() {
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'manageSensitiveWords',
      data: {
        action: 'listRules',
        data: {
          keyword: this.data.searchKeyword
        }
      }
    }).then(res => {
      this.setData({ loading: false })
      if (res.result.success) {
        this.setData({ rules: res.result.rules })
      } else {
        wx.showToast({ title: res.result.error || '加载失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('加载审核规则失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // 规则名称输入
  onNameInput(e) {
    this.setData({
      'newRule.name': e.detail.value
    })
  },

  // 正则表达式输入
  onPatternInput(e) {
    this.setData({
      'newRule.pattern': e.detail.value
    })
  },

  // 描述输入
  onDescriptionInput(e) {
    this.setData({
      'newRule.description': e.detail.value
    })
  },

  // 添加审核规则
  addModerationRule() {
    const { name, pattern, description } = this.data.newRule
    
    if (!name || !pattern) {
      wx.showToast({ title: '请填写规则名称和正则表达式', icon: 'none' })
      return
    }
    
    // 验证正则表达式格式
    try {
      new RegExp(pattern.replace(/^\/|\/$/g, ''))
    } catch (e) {
      wx.showToast({ title: '正则表达式格式错误', icon: 'none' })
      return
    }
    
    wx.cloud.callFunction({
      name: 'manageSensitiveWords',
      data: {
        action: 'addRule',
        data: {
          name,
          pattern,
          description
        }
      }
    }).then(res => {
      if (res.result.success) {
        wx.showToast({ title: '添加成功' })
        this.setData({
          newRule: {
            name: '',
            pattern: '',
            description: ''
          }
        })
        this.loadModerationRules()
      } else {
        wx.showToast({ title: res.result.error || '添加失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('添加审核规则失败:', err)
      wx.showToast({ title: '添加失败', icon: 'none' })
    })
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  // 搜索规则
  searchRules() {
    this.loadModerationRules()
  },

  // 编辑规则
  editRule(e) {
    const ruleId = e.currentTarget.dataset.id
    const rule = this.data.rules.find(r => r._id === ruleId)
    
    if (rule) {
      wx.showModal({
        title: '编辑规则',
        content: '请输入新的规则名称',
        editable: true,
        placeholderText: '规则名称',
        defaultText: rule.name,
        success: (res) => {
          if (res.confirm && res.content) {
            this.updateModerationRule(ruleId, res.content, rule.pattern, rule.description)
          }
        }
      })
    }
  },

  // 更新审核规则
  updateModerationRule(ruleId, name, pattern, description) {
    wx.cloud.callFunction({
      name: 'manageSensitiveWords',
      data: {
        action: 'updateRule',
        data: {
          ruleId,
          name,
          pattern,
          description
        }
      }
    }).then(res => {
      if (res.result.success) {
        wx.showToast({ title: '更新成功' })
        this.loadModerationRules()
      } else {
        wx.showToast({ title: res.result.error || '更新失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('更新审核规则失败:', err)
      wx.showToast({ title: '更新失败', icon: 'none' })
    })
  },

  // 删除审核规则
  deleteRule(e) {
    const ruleId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '删除审核规则',
      content: '确定要删除这个审核规则吗？',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'manageSensitiveWords',
            data: {
              action: 'deleteRule',
              data: {
                ruleId
              }
            }
          }).then(res => {
            if (res.result.success) {
              wx.showToast({ title: '删除成功' })
              this.loadModerationRules()
            } else {
              wx.showToast({ title: res.result.error || '删除失败', icon: 'none' })
            }
          }).catch(err => {
            console.error('删除审核规则失败:', err)
            wx.showToast({ title: '删除失败', icon: 'none' })
          })
        }
      }
    })
  }
})