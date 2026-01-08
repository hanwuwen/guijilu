// index.js
Page({
  data: {
    activities: [],
    loading: false,
    searchQuery: ''
  },

  onLoad() {
    this.loadActivities()
  },

  onShow() {
    // 每次页面显示时刷新活动列表
    this.loadActivities()
  },

  // 加载活动列表
  loadActivities() {
    this.setData({ loading: true })

    wx.cloud.callFunction({
      name: 'getActivityList',
      data: {
        query: this.data.searchQuery
      }
    }).then(res => {
      this.setData({
        activities: res.result.data || [],
        loading: false
      })
    }).catch(err => {
      console.error('加载活动列表失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value })
  },

  // 扫码加入活动
  scanCode() {
    wx.scanCode({
      success: res => {
        const activityId = res.result
        this.goToActivity({ currentTarget: { dataset: { id: activityId } } })
      },
      fail: err => {
        console.error('扫码失败:', err)
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        })
      }
    })
  },

  // 跳转到活动详情页
  goToActivity(e) {
    const activityId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/activity/activity?id=${activityId}`
    })
  },

  // 跳转到创建活动页
  goToCreate() {
    wx.navigateTo({
      url: '/pages/create/create'
    })
  },

  // 加载更多活动
  loadMore() {
    // 这里可以实现分页加载逻辑
    wx.showToast({
      title: '已加载全部',
      icon: 'none'
    })
  }
})