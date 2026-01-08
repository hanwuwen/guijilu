// activity.js
Page({
  data: {
    activity: {},
    loading: true,
    isParticipant: false,
    userCheckins: [],
    completedCheckpoints: 0,
    qrcode: ''
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