// comment-management.js
Page({
  data: {
    comments: [],
    loading: false,
    skip: 0,
    limit: 20,
    searchActivityId: ''
  },

  onLoad() {
    this.checkAdminPermission()
    this.getComments()
  },

  onPullDownRefresh() {
    this.setData({ skip: 0, comments: [] })
    this.getComments(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    this.getComments()
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
        if (!userInfo.admin) {
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

  // 获取评论列表
  getComments(callback) {
    if (this.data.loading) return

    this.setData({ loading: true })

    wx.cloud.callFunction({
      name: 'getCommentsAdmin',
      data: {
        skip: this.data.skip,
        limit: this.data.limit,
        activityId: this.data.searchActivityId
      }
    }).then(res => {
      this.setData({ loading: false })
      if (res.result.success) {
        const newComments = res.result.data
        this.setData({
          comments: this.data.skip === 0 ? newComments : [...this.data.comments, ...newComments],
          skip: this.data.skip + this.data.limit
        })
      } else {
        wx.showToast({
          title: res.result.error || '获取评论信息失败',
          icon: 'none'
        })
      }
      if (callback) callback()
    }).catch(err => {
      console.error('获取评论信息失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '获取评论信息失败',
        icon: 'none'
      })
      if (callback) callback()
    })
  },

  // 搜索评论
  searchComments() {
    this.setData({ skip: 0, comments: [] })
    this.getComments()
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchActivityId: e.detail.value })
  },

  // 删除评论
  deleteComment(e) {
    const commentId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '删除评论',
      content: '确定要删除这条评论吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          
          wx.cloud.callFunction({
            name: 'deleteComment',
            data: {
              commentId: commentId
            }
          }).then(res => {
            wx.hideLoading()
            if (res.result.success) {
              wx.showToast({ title: '删除成功' })
              // 刷新评论列表
              this.setData({ skip: 0, comments: [] })
              this.getComments()
            } else {
              wx.showToast({ title: res.result.error || '删除失败', icon: 'none' })
            }
          }).catch(err => {
            console.error('删除评论失败:', err)
            wx.hideLoading()
            wx.showToast({ title: '删除失败', icon: 'none' })
          })
        }
      }
    })
  },

  // 格式化时间
  formatTime(time) {
    if (!time) return ''
    const date = new Date(time)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
})