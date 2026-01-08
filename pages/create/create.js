// create.js
Page({
  data: {
    activity: {
      name: '',
      description: '',
      city: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      coverImage: ''
    },
    checkpoints: [],
    submitting: false
  },

  onLoad() {
    // 初始化时添加一个打卡地点
    this.addCheckpoint()
  },

  // 输入框变化
  onInputChange(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`activity.${field}`]: value
    })
  },

  // 日期选择
  onDateChange(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`activity.${field}`]: value
    })
  },

  // 上传封面
  uploadCover() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePaths = res.tempFilePaths
        this.uploadImage(tempFilePaths[0])
      }
    })
  },

  // 上传图片到云存储
  uploadImage(tempFilePath) {
    wx.showLoading({ title: '上传中...' })
    const cloudPath = `covers/${Date.now()}.jpg`
    
    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempFilePath
    }).then(res => {
      this.setData({
        'activity.coverImage': res.fileID
      })
      wx.hideLoading()
      wx.showToast({ title: '上传成功' })
    }).catch(err => {
      console.error('上传封面失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '上传失败', icon: 'none' })
    })
  },

  // 添加打卡地点
  addCheckpoint() {
    if (this.data.checkpoints.length >= 20) {
      wx.showToast({ title: '最多添加20个打卡地点', icon: 'none' })
      return
    }

    this.setData({
      checkpoints: [...this.data.checkpoints, {
        name: '',
        description: '',
        location: null
      }]
    })
  },

  // 删除打卡地点
  deleteCheckpoint(e) {
    const index = e.currentTarget.dataset.index
    const checkpoints = this.data.checkpoints.filter((_, i) => i !== index)
    this.setData({ checkpoints })
  },

  // 打卡地点信息变化
  onCheckpointChange(e) {
    const index = e.currentTarget.dataset.index
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    
    const checkpoints = [...this.data.checkpoints]
    checkpoints[index][field] = value
    this.setData({ checkpoints })
  },

  // 选择位置
  selectLocation(e) {
    const index = e.currentTarget.dataset.index
    
    wx.chooseLocation({
      success: res => {
        const checkpoints = [...this.data.checkpoints]
        checkpoints[index].location = {
          name: res.name,
          address: res.address,
          latitude: res.latitude,
          longitude: res.longitude
        }
        this.setData({ checkpoints })
      },
      fail: err => {
        console.error('选择位置失败:', err)
      }
    })
  },

  // 提交活动
  submitActivity() {
    // 验证表单
    if (!this.validateForm()) {
      return
    }

    this.setData({ submitting: true })

    wx.cloud.callFunction({
      name: 'createActivity',
      data: {
        activity: this.data.activity,
        checkpoints: this.data.checkpoints
      }
    }).then(res => {
      this.setData({ submitting: false })
      
      if (res.result.success) {
        wx.showToast({ title: '创建成功' })
        // 跳转到活动详情页
        wx.navigateTo({
          url: `/pages/activity/activity?id=${res.result.activityId}`
        })
      } else {
        wx.showToast({ title: '创建失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('创建活动失败:', err)
      this.setData({ submitting: false })
      wx.showToast({ title: '创建失败', icon: 'none' })
    })
  },

  // 验证表单
  validateForm() {
    const { activity, checkpoints } = this.data
    
    if (!activity.name.trim()) {
      wx.showToast({ title: '请输入活动名称', icon: 'none' })
      return false
    }
    
    if (!activity.description.trim()) {
      wx.showToast({ title: '请输入活动描述', icon: 'none' })
      return false
    }
    
    if (!activity.city.trim()) {
      wx.showToast({ title: '请输入活动城市', icon: 'none' })
      return false
    }
    
    if (activity.startDate > activity.endDate) {
      wx.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' })
      return false
    }
    
    if (checkpoints.length === 0) {
      wx.showToast({ title: '请至少添加一个打卡地点', icon: 'none' })
      return false
    }
    
    // 验证每个打卡地点
    for (let i = 0; i < checkpoints.length; i++) {
      const checkpoint = checkpoints[i]
      if (!checkpoint.name.trim()) {
        wx.showToast({ title: `请输入第${i + 1}个打卡地点名称`, icon: 'none' })
        return false
      }
      if (!checkpoint.location) {
        wx.showToast({ title: `请为第${i + 1}个打卡地点选择位置`, icon: 'none' })
        return false
      }
    }
    
    return true
  }
})