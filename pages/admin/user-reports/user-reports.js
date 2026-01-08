// user-reports.js
Page({
  data: {
    reports: [],
    filterStatus: '',
    loading: false,
    skip: 0,
    limit: 20
  },

  onLoad() {
    this.checkAdminPermission()
    this.getReports()
  },

  onPullDownRefresh() {
    this.setData({ skip: 0, reports: [] })
    this.getReports(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    this.getReports()
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

  // 获取举报列表
  getReports(callback) {
    if (this.data.loading) return

    this.setData({ loading: true })

    wx.cloud.callFunction({
      name: 'getUserReports',
      data: {
        skip: this.data.skip,
        limit: this.data.limit,
        status: this.data.filterStatus
      }
    }).then(res => {
      this.setData({ loading: false })
      if (res.result.success) {
        const newReports = res.result.data
        this.setData({
          reports: this.data.skip === 0 ? newReports : [...this.data.reports, ...newReports],
          skip: this.data.skip + this.data.limit
        })
      } else {
        wx.showToast({
          title: res.result.error || '获取举报信息失败',
          icon: 'none'
        })
      }
      if (callback) callback()
    }).catch(err => {
      console.error('获取举报信息失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '获取举报信息失败',
        icon: 'none'
      })
      if (callback) callback()
    })
  },

  // 设置筛选状态
  setFilterStatus(e) {
    const status = e.currentTarget.dataset.status || ''
    this.setData({ filterStatus: status, skip: 0, reports: [] })
    this.getReports()
  },

  // 处理举报
  handleReport(e) {
    const { id, action } = e.currentTarget.dataset
    
    wx.showModal({
      title: action === 'accept' ? '确认违规' : '驳回举报',
      content: action === 'accept' ? '确认处理此违规内容？' : '确定要驳回此举报吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          
          wx.cloud.callFunction({
            name: 'handleUserReport',
            data: {
              reportId: id,
              action: action,
              reason: action === 'accept' ? '确认违规，已处理相关内容' : '举报证据不足，驳回举报'
            }
          }).then(res => {
            wx.hideLoading()
            if (res.result.success) {
              wx.showToast({ title: '处理成功' })
              // 刷新举报列表
              this.setData({ skip: 0, reports: [] })
              this.getReports()
            } else {
              wx.showToast({ title: res.result.error || '处理失败', icon: 'none' })
            }
          }).catch(err => {
            console.error('处理举报失败:', err)
            wx.hideLoading()
            wx.showToast({ title: '处理失败', icon: 'none' })
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
  },

  // 获取举报类型文本
  getReportTypeText(type) {
    const typeMap = {
      'spam': '垃圾信息',
      'abuse': '辱骂攻击',
      'porn': '色情内容',
      'illegal': '违法违规',
      'other': '其他原因'
    }
    return typeMap[type] || '未知类型'
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'pending': '待处理',
      'processed': '已处理',
      'rejected': '已驳回'
    }
    return statusMap[status] || '未知状态'
  }
})