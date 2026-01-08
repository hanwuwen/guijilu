// checkin-records.js
Page({
  data: {
    loading: true,
    records: [],
    levelInfo: null
  },

  onLoad() {
    this.loadCheckinRecords()
    this.getUserLevelInfo()
  },

  onShow() {
    // 每次页面显示时重新加载数据
    this.loadCheckinRecords()
    this.getUserLevelInfo()
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
        progress,
        exp
      }
    })
  },

  // 加载打卡记录
  loadCheckinRecords() {
    this.setData({ loading: true })

    // 调用云函数获取打卡记录
    wx.cloud.callFunction({
      name: 'getUserCheckinRecords'
    }).then(res => {
      this.setData({ loading: false })
      if (res.result.success) {
        this.setData({ records: res.result.records })
      } else {
        // 使用模拟数据
        this.setData({ records: this.getMockRecords() })
      }
    }).catch(err => {
      console.error('加载打卡记录失败:', err)
      this.setData({ loading: false })
      // 使用模拟数据
      this.setData({ records: this.getMockRecords() })
    })
  },

  // 模拟打卡记录数据
  getMockRecords() {
    return [
      {
        _id: '1',
        activityId: 'activity1',
        activityName: '城市地标探索',
        checkpointName: '天安门广场',
        checkinDate: '2026-01-08',
        note: '今天天气很好，天安门广场人很多，很热闹！',
        images: [
          'https://via.placeholder.com/300x300?text=天安门1',
          'https://via.placeholder.com/300x300?text=天安门2'
        ],
        locationName: '北京市东城区'
      },
      {
        _id: '2',
        activityId: 'activity1',
        activityName: '城市地标探索',
        checkpointName: '故宫博物院',
        checkinDate: '2026-01-07',
        note: '故宫真的很震撼，感受到了历史的厚重感。',
        images: [
          'https://via.placeholder.com/300x300?text=故宫1'
        ],
        locationName: '北京市东城区'
      },
      {
        _id: '3',
        activityId: 'activity2',
        activityName: '城市公园之旅',
        checkpointName: '颐和园',
        checkinDate: '2026-01-06',
        note: '颐和园的风景真美，湖水清澈，空气清新。',
        images: [],
        locationName: '北京市海淀区'
      }
    ]
  },

  // 跳转到活动详情页面
  goToActivityDetail(e) {
    const activityId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/activity/activity?id=${activityId}`
    })
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index
    const images = e.currentTarget.dataset.images
    wx.previewImage({
      current: images[index],
      urls: images
    })
  },

  // 跳转到首页
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadCheckinRecords()
    wx.stopPullDownRefresh()
  }
})
