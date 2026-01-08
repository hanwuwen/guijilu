// chat-list.js
Page({
  data: {
    conversations: [],
    loading: true,
    openid: ''
  },

  onLoad: function () {
    // 获取用户openid
    this.getOpenid()
    // 获取对话列表
    this.getConversations()
  },

  onShow: function () {
    // 页面显示时刷新对话列表
    this.getConversations()
  },

  // 获取用户openid
  getOpenid: function () {
    wx.cloud.callFunction({
      name: 'getUserInfo',
      data: {}
    }).then(res => {
      if (res.result.success) {
        this.setData({ openid: res.result.userInfo.openid })
      }
    })
  },

  // 获取对话列表
  getConversations: function () {
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'getConversations',
      data: {}
    }).then(res => {
      if (res.result.success) {
        this.setData({
          conversations: res.result.conversations,
          loading: false
        })
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: '获取对话列表失败', icon: 'none' })
      }
    })
  },

  // 进入聊天页面
  enterChat: function (e) {
    const { conversation } = e.currentTarget.dataset
    
    let otherUserId = ''
    if (conversation.type === 'single') {
      otherUserId = conversation.otherParticipants[0].openid
    }
    
    wx.navigateTo({
      url: `/pages/chat/chat?conversationId=${conversation._id}&type=${conversation.type}&name=${conversation.name}&otherUserId=${otherUserId}`
    })
  },

  // 创建新对话
  createConversation: function () {
    // 这里可以跳转到选择联系人页面
    wx.showToast({ title: '功能开发中', icon: 'none' })
  }
})
