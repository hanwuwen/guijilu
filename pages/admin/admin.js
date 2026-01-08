// admin.js
Page({
  data: {
    userInfo: null,
    loading: true
  },

  onLoad() {
    this.checkAdminPermission()
  },

  // 检查管理员权限
  checkAdminPermission() {
    wx.showLoading({ title: '权限验证中...' })

    wx.cloud.callFunction({
      name: 'getUserInfo'
    }).then(res => {
      wx.hideLoading()
      if (res.result.success) {
        const userInfo = res.result.userInfo
        this.setData({ userInfo })
        
        // 检查用户是否为管理员 (这里假设管理员有特定的标识，例如admin字段为true)
        if (userInfo.admin) {
          this.setData({ loading: false })
        } else {
          // 非管理员，显示无权限提示并返回
          wx.showModal({
            title: '权限不足',
            content: '您不是管理员，无法访问此页面',
            showCancel: false,
            success: () => {
              wx.navigateBack()
            }
          })
        }
      } else {
        wx.hideLoading()
        wx.showModal({
          title: '错误',
          content: '获取用户信息失败',
          showCancel: false,
          success: () => {
            wx.navigateBack()
          }
        })
      }
    }).catch(err => {
      console.error('检查管理员权限失败:', err)
      wx.hideLoading()
      wx.showModal({
        title: '错误',
        content: '权限验证失败',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
    })
  },

  // 前往用户管理页面
  goToUserManagement() {
    wx.showModal({
      title: '功能开发中',
      content: '用户管理功能正在开发中，敬请期待',
      showCancel: false
    })
  },

  // 前往用户举报页面
  goToUserReports() {
    wx.navigateTo({ url: '/pages/admin/user-reports/user-reports' })
  },

  // 前往活动管理页面
  goToActivityManagement() {
    wx.showModal({
      title: '功能开发中',
      content: '活动管理功能正在开发中，敬请期待',
      showCancel: false
    })
  },

  // 前往评论管理页面
  goToCommentManagement() {
    wx.navigateTo({ url: '/pages/admin/comment-management/comment-management' })
  },

  // 前往聊天记录管理页面
  goToChatManagement() {
    wx.showModal({
      title: '功能开发中',
      content: '聊天记录管理功能正在开发中，敬请期待',
      showCancel: false
    })
  },

  // 前往反馈管理页面
  goToFeedbackManagement() {
    wx.navigateTo({ url: '/pages/admin/feedback-management/feedback-management' })
  },

  // 前往敏感词管理页面
  goToSensitiveWordManagement() {
    wx.navigateTo({ url: '/pages/admin/sensitive-word-management/sensitive-word-management' })
  },

  // 前往审核规则管理页面
  goToModerationRulesManagement() {
    wx.navigateTo({ url: '/pages/admin/moderation-rules-management/moderation-rules-management' })
  },

  // 前往系统设置页面
  goToSystemSettings() {
    wx.showModal({
      title: '功能开发中',
      content: '系统设置功能正在开发中，敬请期待',
      showCancel: false
    })
  },

  // 前往操作日志页面
  goToLogManagement() {
    wx.showModal({
      title: '功能开发中',
      content: '操作日志功能正在开发中，敬请期待',
      showCancel: false
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出管理员登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 这里可以添加退出登录的逻辑，例如清除管理员状态等
          wx.navigateBack()
        }
      }
    })
  }
})