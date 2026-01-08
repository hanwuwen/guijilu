// index.js
Page({
  data: {
    activities: [],
    loading: false,
    refreshing: false,
    searchQuery: ''
  },

  onLoad() {
    this.loadActivities()
  },

  onShow() {
    // 每次页面显示时刷新活动列表
    this.loadActivities()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ refreshing: true })
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
      // 为每个活动添加点赞状态和点赞数
      const activities = (res.result.data || []).map(activity => ({
        ...activity,
        liked: activity.liked || false,
        likes: activity.likes || 0
      }))
      
      this.setData({
        activities: activities,
        loading: false,
        refreshing: false
      })
      
      // 停止下拉刷新
      wx.stopPullDownRefresh()
    }).catch(err => {
      console.error('加载活动列表失败:', err)
      this.setData({ 
        loading: false,
        refreshing: false 
      })
      wx.stopPullDownRefresh()
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
  },

  // 点赞活动
  likeActivity(e) {
    const activityId = e.currentTarget.dataset.id
    const activities = this.data.activities.map(activity => {
      if (activity._id === activityId) {
        return {
          ...activity,
          liked: true,
          likes: (activity.likes || 0) + 1
        }
      }
      return activity
    })
    
    this.setData({ activities })
    
    // 这里可以调用云函数更新点赞状态
    wx.cloud.callFunction({
      name: 'updateActivity',
      data: {
        activityId: activityId,
        action: 'like'
      }
    }).catch(err => {
      console.error('点赞失败:', err)
    })
  },

  // 取消点赞
  unlikeActivity(e) {
    const activityId = e.currentTarget.dataset.id
    const activities = this.data.activities.map(activity => {
      if (activity._id === activityId) {
        return {
          ...activity,
          liked: false,
          likes: Math.max(0, (activity.likes || 0) - 1)
        }
      }
      return activity
    })
    
    this.setData({ activities })
    
    // 这里可以调用云函数更新点赞状态
    wx.cloud.callFunction({
      name: 'updateActivity',
      data: {
        activityId: activityId,
        action: 'unlike'
      }
    }).catch(err => {
      console.error('取消点赞失败:', err)
    })
  },

  // 分享活动
  shareActivity(e) {
    const activityId = e.currentTarget.dataset.id
    const activity = this.data.activities.find(a => a._id === activityId)
    
    if (activity) {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      })
      
      // 保存当前分享的活动ID，用于onShareAppMessage和onShareTimeline
      this.currentShareActivity = activity
    }
  },

  // 分享到微信好友
  onShareAppMessage() {
    if (this.currentShareActivity) {
      const activity = this.currentShareActivity
      return {
        title: `来参加「${activity.name}」活动吧！`,
        path: `/pages/activity/activity?id=${activity._id}`,
        imageUrl: activity.coverImage || 'https://via.placeholder.com/500x400?text=活动封面'
      }
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    if (this.currentShareActivity) {
      const activity = this.currentShareActivity
      return {
        title: `来参加「${activity.name}」活动吧！`,
        query: `id=${activity._id}`,
        imageUrl: activity.coverImage || 'https://via.placeholder.com/500x400?text=活动封面'
      }
    }
  }
})