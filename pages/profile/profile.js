// profile.js
Page({
  data: {
    loading: true,
    userInfo: {},
    stats: {},
    achievements: {
      checkins: 0,
      badges: 0,
      ranking: 0
    },
    recentAchievements: []
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
        // 计算等级进度
        this.calculateLevelProgress(res.result.userInfo)
      }
      this.loadAchievements()
    }).catch(err => {
      console.error('加载用户信息失败:', err)
      this.setData({ loading: false })
    })
  },

  // 计算等级进度
  calculateLevelProgress(userInfo) {
    const { level = 1, exp = 0 } = userInfo
    
    // 等级经验配置
    const levelExpConfig = [
      { level: 1, minExp: 0, maxExp: 99 },
      { level: 2, minExp: 100, maxExp: 299 },
      { level: 3, minExp: 300, maxExp: 599 },
      { level: 4, minExp: 600, maxExp: 999 },
      { level: 5, minExp: 1000, maxExp: 1499 },
      { level: 6, minExp: 1500, maxExp: 2499 },
      { level: 7, minExp: 2500, maxExp: 3999 },
      { level: 8, minExp: 4000, maxExp: 5999 },
      { level: 9, minExp: 6000, maxExp: 8999 },
      { level: 10, minExp: 9000, maxExp: 999999 }
    ]
    
    const currentLevelConfig = levelExpConfig.find(l => l.level === level) || levelExpConfig[0]
    const levelExpRange = currentLevelConfig.maxExp - currentLevelConfig.minExp
    const currentLevelExp = exp - currentLevelConfig.minExp
    const progress = Math.min(Math.round((currentLevelExp / levelExpRange) * 100), 100)
    
    // 等级名称和图标
    const levelNames = [
      { name: '漫游新手', icon: '🌱', color: '#999999' },
      { name: '漫游探索者', icon: '🧭', color: '#66CCFF' },
      { name: '漫游达人', icon: '🏃', color: '#9966FF' },
      { name: '漫游精英', icon: '🌟', color: '#FF9966' },
      { name: '漫游大师', icon: '🏆', color: '#FF6666' },
      { name: '漫游专家', icon: '💎', color: '#FF66B2' },
      { name: '漫游传奇', icon: '⚡', color: '#9933FF' },
      { name: '漫游神话', icon: '🔥', color: '#FF3366' },
      { name: '漫游圣徒', icon: '👑', color: '#FFCC00' },
      { name: '漫游王者', icon: '👑', color: '#FF6600' }
    ]
    
    const levelInfo = levelNames[Math.min(level - 1, levelNames.length - 1)] || levelNames[0]
    
    this.setData({
      levelInfo: {
        ...levelInfo,
        level,
        exp,
        progress,
        nextLevelExp: currentLevelConfig.maxExp + 1
      }
    })
  },

  // 加载成就数据
  loadAchievements() {
    wx.cloud.callFunction({
      name: 'getUserAchievements'
    }).then(res => {
      if (res.result.success) {
        this.setData({
          achievements: res.result.achievements,
          recentAchievements: res.result.recentAchievements
        })
      } else {
        // 模拟数据，实际项目中应该从云函数获取
        this.setData({
          achievements: {
            checkins: 12,
            badges: 3,
            ranking: 42
          },
          recentAchievements: [
            {
              icon: '🏅',
              title: '首次参与',
              description: '成功参与第一个城市探索活动',
              date: '2024-01-15'
            },
            {
              icon: '📍',
              title: '打卡达人',
              description: '完成10个打卡点',
              date: '2024-01-18'
            },
            {
              icon: '🌟',
              title: '活动先锋',
              description: '创建第一个活动',
              date: '2024-01-20'
            }
          ]
        })
      }
      this.setData({ loading: false })
    }).catch(err => {
      console.error('加载成就数据失败:', err)
      // 模拟数据
      this.setData({
        achievements: {
          checkins: 12,
          badges: 3,
          ranking: 42
        },
        recentAchievements: [
          {
            icon: '🏅',
            title: '首次参与',
            description: '成功参与第一个城市探索活动',
            date: '2024-01-15'
          },
          {
            icon: '📍',
            title: '打卡达人',
            description: '完成10个打卡点',
            date: '2024-01-18'
          },
          {
            icon: '🌟',
            title: '活动先锋',
            description: '创建第一个活动',
            date: '2024-01-20'
          }
        ]
      })
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
  },

  // 前往打卡记录页面
  goToCheckinRecords() {
    wx.navigateTo({
      url: '/pages/checkin-records/checkin-records'
    })
  },

  // 前往管理员中心页面
  goToAdmin() {
    wx.navigateTo({
      url: '/pages/admin/admin'
    })
  }
})