// app.js
App({
  onLaunch() {
    // 云开发环境初始化
    wx.cloud.init({
      env: 'your-cloud-env-id', // 请替换为你的云开发环境ID
      traceUser: true
    })

    // 检查用户登录状态
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已授权
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
            }
          })
        }
      }
    })
  },

  globalData: {
    userInfo: null,
    currentActivity: null
  }
})