// splash.js
Page({
  data: {
    // 页面数据
  },

  onLoad() {
    // 页面加载时的初始化
  },

  // 跳转到首页
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '城市漫游者 - 探索城市的每一个角落',
      path: '/pages/splash/splash',
      imageUrl: 'https://via.placeholder.com/500x400?prompt=城市轨迹录%20地图%20路线%20探索%20现代风格%20蓝色调&image_size=landscape_16_9'
    }
  }
})