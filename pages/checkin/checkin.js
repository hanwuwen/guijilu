// checkin.js
Page({
  data: {
    loading: true,
    activityId: '',
    checkpointIndex: 0,
    checkpoint: {},
    currentLocation: {},
    distance: null,
    canCheckin: false,
    checkinNote: '',
    checkinImages: []
  },

  onLoad(options) {
    this.activityId = options.activityId
    this.checkpointIndex = parseInt(options.checkpointIndex)
    this.loadCheckpoint()
  },

  // 加载打卡点信息
  loadCheckpoint() {
    this.setData({ loading: true })

    wx.cloud.callFunction({
      name: 'getActivity',
      data: {
        activityId: this.activityId
      }
    }).then(res => {
      if (res.result.success) {
        const activity = res.result.activity
        const checkpoint = activity.checkpoints[this.checkpointIndex]
        this.setData({ checkpoint })
        this.getLocation()
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' })
        this.setData({ loading: false })
      }
    }).catch(err => {
      console.error('加载打卡点失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // 获取当前位置
  getLocation() {
    wx.showLoading({ title: '获取位置中...' })

    wx.chooseLocation({
      success: res => {
        wx.hideLoading()
        this.setData({ currentLocation: res })
        this.calculateDistance(res.latitude, res.longitude)
      },
      fail: err => {
        console.error('获取位置失败:', err)
        wx.hideLoading()
        wx.showToast({ title: '获取位置失败', icon: 'none' })
        this.setData({ loading: false })
      }
    })
  },

  // 计算距离
  calculateDistance(lat1, lon1) {
    const checkpoint = this.data.checkpoint
    const lat2 = checkpoint.location.latitude
    const lon2 = checkpoint.location.longitude

    // 计算两点之间的距离（使用 Haversine 公式）
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = Math.round(R * c);
    this.setData({
      distance,
      canCheckin: distance <= 500,
      loading: false
    })
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 3 - this.data.checkinImages.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePaths = res.tempFilePaths
        this.uploadImages(tempFilePaths)
      }
    })
  },

  // 上传图片
  uploadImages(tempFilePaths) {
    wx.showLoading({ title: '上传图片中...' })
    
    const uploadTasks = tempFilePaths.map((filePath, index) => {
      const cloudPath = `checkin_images/${Date.now()}_${index}.${filePath.split('.').pop()}`
      return wx.cloud.uploadFile({
        cloudPath,
        filePath
      })
    })

    Promise.all(uploadTasks).then(res => {
      wx.hideLoading()
      const fileIDs = res.map(item => item.fileID)
      this.setData({
        checkinImages: [...this.data.checkinImages, ...fileIDs]
      })
    }).catch(err => {
      console.error('上传图片失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '上传图片失败', icon: 'none' })
    })
  },

  // 移除图片
  removeImage(e) {
    const index = e.currentTarget.dataset.index
    const checkinImages = [...this.data.checkinImages]
    checkinImages.splice(index, 1)
    this.setData({ checkinImages })
  },

  // 输入打卡心得
  onNoteInput(e) {
    this.setData({ checkinNote: e.detail.value })
  },

  // 提交打卡
  submitCheckin() {
    if (!this.data.canCheckin) {
      wx.showToast({ title: '距离过远，无法打卡', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交打卡中...' })

    wx.cloud.callFunction({
      name: 'submitCheckin',
      data: {
        activityId: this.activityId,
        checkpointIndex: this.checkpointIndex,
        note: this.data.checkinNote,
        images: this.data.checkinImages,
        location: this.data.currentLocation
      }
    }).then(res => {
      wx.hideLoading()
      if (res.result.success) {
        wx.showToast({ 
          title: '打卡成功', 
          icon: 'success',
          duration: 2000
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 2000)
      } else {
        wx.showToast({ title: '打卡失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('提交打卡失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '打卡失败', icon: 'none' })
    })
  }
})