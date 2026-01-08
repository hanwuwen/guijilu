// chat.js
Page({
  data: {
    conversationId: '',
    conversationType: '',
    conversationName: '',
    otherUserInfo: null,
    messages: [],
    inputValue: '',
    scrollTop: 0,
    loading: false,
    page: 1,
    hasMore: true,
    openid: '',
    userInfo: null,
    showEmoji: false,
    emojis: ['😊', '😂', '❤️', '👍', '🎉', '🤔', '😢', '😎', '🔥', '✨', '👏', '🌟']
  },

  onLoad: function (options) {
    const { conversationId, type, name, otherUserId } = options
    this.setData({
      conversationId,
      conversationType: type,
      conversationName: name
    })
    
    // 获取用户信息
    this.getMyInfo()
    
    // 请求订阅消息授权
    this.requestSubscribeMessage()
    
    // 获取消息记录
    this.getMessages()
    
    // 如果是单聊，获取对方用户信息
    if (type === 'single' && otherUserId) {
      this.getUserInfo(otherUserId)
    }
  },
  
  // 请求订阅消息授权
  requestSubscribeMessage: function () {
    wx.requestSubscribeMessage({
      tmplIds: ['TEMPLATE_ID'], // 需要在小程序后台配置订阅消息模板
      success: (res) => {
        console.log('订阅消息授权成功:', res)
      },
      fail: (err) => {
        console.error('订阅消息授权失败:', err)
      }
    })
  },
  
  // 获取当前用户信息
  getMyInfo: function () {
    wx.cloud.callFunction({
      name: 'getUserInfo',
      data: {}
    }).then(res => {
      if (res.result.success) {
        this.setData({
          openid: res.result.userInfo.openid,
          userInfo: res.result.userInfo
        })
      }
    })
  },

  onShow: function () {
    // 页面显示时刷新消息
    this.getMessages()
  },

  // 获取用户信息
  getUserInfo: function (openid) {
    wx.cloud.callFunction({
      name: 'getUserInfo',
      data: { openid }
    }).then(res => {
      if (res.result.success) {
        this.setData({ otherUserInfo: res.result.userInfo })
      }
    })
  },

  // 获取消息记录
  getMessages: function () {
    if (this.data.loading || !this.data.hasMore) return
    
    this.setData({ loading: true })
    
    const { conversationId, page } = this.data
    const limit = 20
    const offset = (page - 1) * limit
    
    wx.cloud.callFunction({
      name: 'getMessages',
      data: { conversationId, limit, offset }
    }).then(res => {
      if (res.result.success) {
        const messages = res.result.messages
        this.setData({
          messages: page === 1 ? messages : [...messages, ...this.data.messages],
          loading: false,
          page: page + 1,
          hasMore: messages.length === limit
        })
        
        // 滚动到底部
        if (page === 1) {
          setTimeout(() => {
            this.setData({ scrollTop: 999999 })
          }, 100)
        }
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: '获取消息失败', icon: 'none' })
      }
    })
  },

  // 发送消息
  sendMessage: function () {
    const { inputValue, conversationId } = this.data
    if (!inputValue.trim()) return
    
    wx.cloud.callFunction({
      name: 'sendMessage',
      data: { conversationId, content: inputValue.trim() }
    }).then(res => {
      if (res.result.success) {
        // 清空输入框
        this.setData({ inputValue: '' })
        // 重新获取消息
        this.getMessages()
      } else {
        wx.showToast({ title: res.result.error || '发送失败', icon: 'none' })
      }
    })
  },

  // 输入框变化
  inputChange: function (e) {
    this.setData({ inputValue: e.detail.value })
  },

  // 选择图片
  chooseImage: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths
        this.uploadImage(tempFilePaths[0])
      }
    })
  },

  // 上传图片
  uploadImage: function (tempFilePath) {
    wx.cloud.uploadFile({
      cloudPath: 'chat-images/' + Date.now() + '.jpg',
      filePath: tempFilePath,
      success: (res) => {
        // 发送图片消息
        const { conversationId } = this.data
        wx.cloud.callFunction({
          name: 'sendMessage',
          data: { 
            conversationId, 
            content: res.fileID, 
            type: 'image' 
          }
        }).then(res => {
          if (res.result.success) {
            // 重新获取消息
            this.getMessages()
          } else {
            wx.showToast({ title: res.result.error || '发送失败', icon: 'none' })
          }
        })
      },
      fail: (err) => {
        console.error('上传图片失败:', err)
        wx.showToast({ title: '上传失败', icon: 'none' })
      }
    })
  },

  // 显示表情面板
  showEmojiPanel: function () {
    this.setData({ showEmoji: !this.data.showEmoji })
  },

  // 选择表情
  selectEmoji: function (e) {
    const emoji = e.currentTarget.dataset.emoji
    this.setData({ 
      inputValue: this.data.inputValue + emoji,
      showEmoji: false
    })
  },

  // 滚动到底部，加载更多消息
  scrollToBottom: function () {
    this.getMessages()
  },

  // 返回聊天列表
  goBack: function () {
    wx.navigateBack()
  }
})
