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
    checkinImages: [],
    showSuccessAnimation: false,
    levelReward: null
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
        // 获取用户等级信息
        this.getUserLevelInfo()
        // 显示打卡成功动画
        this.showCheckinSuccessAnimation()
        setTimeout(() => {
          wx.navigateBack()
        }, 3000)
      } else {
        wx.showToast({ title: res.result.error || '打卡失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('提交打卡失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '打卡失败', icon: 'none' })
    })
  },

  // 获取用户等级信息
  getUserLevelInfo() {
    wx.cloud.callFunction({
      name: 'getUserInfo'
    }).then(res => {
      if (res.result.success) {
        const userInfo = res.result.userInfo
        this.setLevelRewardInfo(userInfo)
      }
    }).catch(err => {
      console.error('获取用户信息失败:', err)
    })
  },

  // 设置等级奖励信息
  setLevelRewardInfo(userInfo) {
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
    
    this.setData({
      levelReward: {
        levelUp: true, // 假设每次打卡都可能升级
        newLevel: currentLevelConfig
      }
    })
  },

  // 打卡成功动画
  showCheckinSuccessAnimation() {
    this.setData({ showSuccessAnimation: true })
    setTimeout(() => {
      this.setData({ showSuccessAnimation: false })
    }, 2500)
  }
})