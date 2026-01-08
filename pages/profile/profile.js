// profile.js
Page({
  data: {
    loading: true,
    userInfo: {},
    stats: {}
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    this.setData({ loading: true })

    wx.cloud.callFunction({
      name: 'getUserInfo'
    }).then(res => {
      if (res.result.success) {
        this.setData({
          userInfo: res.result.userInfo,
          stats: res.result.stats
        })
      }
      this.setData({ loading: false })
    }).catch(err => {
      console.error('加载用户信息失败:', err)
      this.setData({ loading: false })
    })
  },

  // 选择头像
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        this.uploadAvatar(res.tempFilePaths[0])
      }
    })
  },

  // 上传头像
  uploadAvatar(filePath) {
    wx.showLoading({ title: '上传头像中...' })

    wx.cloud.uploadFile({
      cloudPath: `avatars/${Date.now()}.${filePath.split('.').pop()}`,
      filePath
    }).then(res => {
      wx.hideLoading()
      if (res.fileID) {
        this.setData({
          'userInfo.avatarUrl': res.fileID
        })
        this.updateUserInfo()
      }
    }).catch(err => {
      console.error('上传头像失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '上传头像失败', icon: 'none' })
    })
  },

  // 昵称修改
  onNickNameChange(e) {
    this.setData({
      'userInfo.nickName': e.detail.value
    })
  },

  // 签名修改
  onSignatureChange(e) {
    this.setData({
      'userInfo.signature': e.detail.value
    })
  },

  // 城市修改
  onCityChange(e) {
    this.setData({
      'userInfo.city': e.detail.value
    })
  },

  // 保存用户信息
  saveProfile() {
    wx.showLoading({ title: '保存中...' })

    this.updateUserInfo().then(() => {
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
    }).catch(err => {
      console.error('保存失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  },

  // 更新用户信息到云数据库
  updateUserInfo() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: {
          userInfo: this.data.userInfo
        }
      }).then(res => {
        if (res.result.success) {
          resolve()
        } else {
          reject(res.result.error)
        }
      }).catch(err => {
        reject(err)
      })
    })
  },

  // 前往关于页面
  goToAbout() {
    wx.showModal({
      title: '关于城市漫游者',
      content: '城市漫游者是一个支持用户创建、参与和分享城市探索活动的微信小程序。\n\n版本: 1.0.0\n开发者: 个人开发',
      showCancel: false
    })
  },

  // 前往设置页面
  goToSettings() {
    wx.showModal({
      title: '设置',
      content: '功能开发中...',
      showCancel: false
    })
  }
})