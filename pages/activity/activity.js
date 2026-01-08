// activity.js
Page({
  data: {
    activity: {},
    loading: true,
    isParticipant: false,
    userCheckins: [],
    completedCheckpoints: 0,
    qrcode: '',
    comments: [],
    commentContent: '',
    levelInfo: null
  },

  onLoad(options) {
    this.activityId = options.id
    this.loadActivity()
  },

  // 加载活动信息
  loadActivity() {
    this.setData({ loading: true })

    wx.cloud.callFunction({
      name: 'getActivity',
      data: {
        activityId: this.activityId
      }
    }).then(res => {
      if (res.result.success) {
        this.setData({
          activity: res.result.activity,
          isParticipant: res.result.isParticipant,
          userCheckins: res.result.userCheckins || [],
          completedCheckpoints: res.result.completedCheckpoints || 0
        })
        this.generateQRCode()
        this.loadComments()
        this.getUserLevelInfo()
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
      this.setData({ loading: false })
    }).catch(err => {
      console.error('加载活动失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // 获取用户等级信息
  getUserLevelInfo() {
    wx.cloud.callFunction({
      name: 'getUserInfo'
    }).then(res => {
      if (res.result.success) {
        const userInfo = res.result.userInfo
        this.calculateLevelProgress(userInfo)
      }
    }).catch(err => {
      console.error('获取用户信息失败:', err)
    })
  },

  // 计算等级进度
  calculateLevelProgress(userInfo) {
    const { level = 1, exp = 0 } = userInfo
    const levelExpConfig = [
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
    
    const currentLevelConfig = levelExpConfig.find(l => l.level === level)
    const progress = Math.round(((exp - currentLevelConfig.minExp) / (currentLevelConfig.maxExp - currentLevelConfig.minExp)) * 100)
    
    this.setData({
      levelInfo: {
        ...currentLevelConfig,
        progress
      }
    })
  },

  // 加载评论
  loadComments() {
    wx.cloud.callFunction({
      name: 'getComments',
      data: {
        activityId: this.activityId
      }
    }).then(res => {
      if (res.result.success) {
        this.setData({ comments: res.result.comments })
      }
    }).catch(err => {
      console.error('加载评论失败:', err)
    })
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({ commentContent: e.detail.value })
  },

  // 提交评论
  submitComment() {
    if (!this.data.commentContent.trim()) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }

    if (!this.data.isParticipant) {
      wx.showToast({ title: '请先加入活动', icon: 'none' })
      return
    }

    wx.showLoading({ title: '发表中...' })

    wx.cloud.callFunction({
      name: 'addComment',
      data: {
        activityId: this.activityId,
        content: this.data.commentContent
      }
    }).then(res => {
      wx.hideLoading()
      if (res.result.success) {
        wx.showToast({ title: '评论成功' })
        this.setData({ commentContent: '' })
        this.loadComments()
      } else {
        wx.showToast({ title: '评论失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('提交评论失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '评论失败', icon: 'none' })
    })
  },

  // 点赞评论
  likeComment(e) {
    const commentId = e.currentTarget.dataset.id
    const comments = this.data.comments.map(comment => {
      if (comment._id === commentId) {
        return {
          ...comment,
          liked: !comment.liked,
          likes: comment.liked ? (comment.likes || 1) - 1 : (comment.likes || 0) + 1
        }
      }
      return comment
    })
    this.setData({ comments })

    wx.cloud.callFunction({
      name: 'likeComment',
      data: {
        commentId: commentId
      }
    })
  },

  // 生成二维码
  generateQRCode() {
    wx.cloud.callFunction({
      name: 'generateQRCode',
      data: {
        content: this.activityId
      }
    }).then(res => {
      if (res.result.success) {
        this.setData({ qrcode: res.result.qrcode })
      }
    }).catch(err => {
      console.error('生成二维码失败:', err)
    })
  },

  // 加入活动
  joinActivity() {
    wx.showLoading({ title: '加入中...' })

    wx.cloud.callFunction({
      name: 'joinActivity',
      data: {
        activityId: this.activityId
      }
    }).then(res => {
      wx.hideLoading()
      if (res.result.success) {
        wx.showToast({ title: '加入成功' })
        this.setData({ isParticipant: true })
        // 重新加载活动信息
        this.loadActivity()
      } else {
        wx.showToast({ title: '加入失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('加入活动失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '加入失败', icon: 'none' })
    })
  },

  // 跳转到打卡页面
  goToCheckin(e) {
    if (!this.data.isParticipant) {
      wx.showToast({ title: '请先加入活动', icon: 'none' })
      return
    }

    const index = e.currentTarget.dataset.index
    wx.navigateTo({
      url: `/pages/checkin/checkin?activityId=${this.activityId}&checkpointIndex=${index}`
    })
  },

  // 跳转到下一个未打卡的地点
  goToNextCheckin() {
    const nextIndex = this.data.userCheckins.indexOf(false)
    if (nextIndex === -1) {
      wx.showToast({ title: '所有地点已打卡', icon: 'none' })
      return
    }

    wx.navigateTo({
      url: `/pages/checkin/checkin?activityId=${this.activityId}&checkpointIndex=${nextIndex}`
    })
  },

  // 领取证书
  getCertificate() {
    wx.navigateTo({
      url: `/pages/certificate/certificate?activityId=${this.activityId}`
    })
  },

  // 分享活动
  shareActivity() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 分享到好友
  onShareAppMessage() {
    return {
      title: this.data.activity.name,
      path: `/pages/activity/activity?id=${this.activityId}`,
      imageUrl: this.data.activity.coverImage
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: this.data.activity.name,
      imageUrl: this.data.activity.coverImage
    }
  }
})