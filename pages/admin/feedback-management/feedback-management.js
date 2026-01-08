// feedback-management.js
Page({
  data: {
    feedbackList: [],
    total: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    activeFilter: '',
    unreadCount: 0,
    showPagination: false,
    showDetail: false,
    showReply: false,
    currentFeedback: null,
    replyContent: '',
    submitting: false
  },

  onLoad() {
    this.getFeedbackList()
  },

  // 获取反馈列表
  getFeedbackList() {
    const { currentPage, pageSize, activeFilter } = this.data
    
    wx.showLoading({ title: '加载中...' })
    
    wx.cloud.callFunction({
      name: 'manageFeedback',
      data: {
        action: 'getFeedbackList',
        page: currentPage,
        pageSize: pageSize,
        status: activeFilter
      }
    }).then(res => {
      wx.hideLoading()
      
      if (res.result.success) {
        const { feedbackList, total, page } = res.result.data
        const totalPages = Math.ceil(total / pageSize)
        
        this.setData({
          feedbackList: feedbackList,
          total: total,
          currentPage: page,
          totalPages: totalPages,
          showPagination: total > pageSize
        })
        
        // 计算未读数量
        this.calculateUnreadCount()
      } else {
        wx.showToast({
          title: '获取反馈失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      console.error('获取反馈列表失败:', err)
      wx.hideLoading()
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })
    })
  },

  // 计算未读数量
  calculateUnreadCount() {
    wx.cloud.callFunction({
      name: 'manageFeedback',
      data: {
        action: 'getFeedbackList',
        page: 1,
        pageSize: 100,
        status: 'pending'
      }
    }).then(res => {
      if (res.result.success) {
        this.setData({
          unreadCount: res.result.data.feedbackList.length
        })
      }
    })
  },

  // 设置筛选条件
  setFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({
      activeFilter: filter,
      currentPage: 1
    })
    this.getFeedbackList()
  },

  // 切换页码
  changePage(e) {
    const page = e.currentTarget.dataset.page
    if (page > 0 && page <= this.data.totalPages) {
      this.setData({ currentPage: page })
      this.getFeedbackList()
    }
  },

  // 查看反馈详情
  viewFeedbackDetail(e) {
    const id = e.currentTarget.dataset.id
    const feedback = this.data.feedbackList.find(item => item._id === id)
    
    if (feedback) {
      this.setData({
        currentFeedback: feedback,
        showDetail: true
      })
      
      // 自动标记为已读
      if (feedback.status === 'pending') {
        this.markAsRead()
      }
    }
  },

  // 标记为已读
  markAsRead() {
    const feedbackId = this.data.currentFeedback._id
    
    wx.cloud.callFunction({
      name: 'manageFeedback',
      data: {
        action: 'markAsRead',
        feedbackId: feedbackId
      }
    }).then(res => {
      if (res.result.success) {
        // 更新本地数据
        const updatedList = this.data.feedbackList.map(item => {
          if (item._id === feedbackId) {
            return { ...item, status: 'read' }
          }
          return item
        })
        
        this.setData({
          feedbackList: updatedList,
          currentFeedback: { ...this.data.currentFeedback, status: 'read' }
        })
        
        // 重新计算未读数量
        this.calculateUnreadCount()
      }
    })
  },

  // 显示回复弹窗
  showReplyModal() {
    this.setData({ showReply: true })
  },

  // 关闭回复弹窗
  closeReplyModal() {
    this.setData({ showReply: false, replyContent: '' })
  },

  // 关闭详情弹窗
  closeDetail() {
    this.setData({ showDetail: false })
  },

  // 回复内容输入
  onReplyInput(e) {
    this.setData({ replyContent: e.detail.value })
  },

  // 提交回复
  submitReply(e) {
    const reply = this.data.replyContent
    const feedbackId = this.data.currentFeedback._id
    
    if (!reply.trim()) {
      wx.showToast({
        title: '回复内容不能为空',
        icon: 'none'
      })
      return
    }
    
    this.setData({ submitting: true })
    
    wx.cloud.callFunction({
      name: 'manageFeedback',
      data: {
        action: 'replyFeedback',
        feedbackId: feedbackId,
        reply: reply.trim()
      }
    }).then(res => {
      this.setData({ submitting: false })
      
      if (res.result.success) {
        wx.showToast({
          title: '回复成功',
          icon: 'success'
        })
        
        // 更新本地数据
        const updatedList = this.data.feedbackList.map(item => {
          if (item._id === feedbackId) {
            return { ...item, reply: reply.trim(), status: 'replied' }
          }
          return item
        })
        
        this.setData({
          feedbackList: updatedList,
          currentFeedback: { ...this.data.currentFeedback, reply: reply.trim(), status: 'replied' },
          showReply: false,
          replyContent: ''
        })
      } else {
        wx.showToast({
          title: '回复失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      console.error('提交回复失败:', err)
      this.setData({ submitting: false })
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })
    })
  },

  // 格式化时间
  formatTime(time) {
    if (!time) return ''
    
    const date = new Date(time)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      pending: '未处理',
      read: '已读',
      replied: '已回复'
    }
    return statusMap[status] || status
  },

  // 获取类型文本
  getTypeText(type) {
    const typeMap = {
      suggestion: '功能建议',
      bug: 'bug报告',
      question: '使用问题',
      other: '其他'
    }
    return typeMap[type] || type
  }
})