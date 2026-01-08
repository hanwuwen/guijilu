// certificate.js
Page({
  data: {
    loading: true,
    activityId: '',
    activity: {},
    userInfo: {},
    completionDate: ''
  },

  onLoad(options) {
    this.activityId = options.activityId
    this.generateCertificate()
  },

  // 生成证书
  generateCertificate() {
    this.setData({ loading: true })

    Promise.all([
      this.getActivityInfo(),
      this.getUserInfo()
    ]).then(([activityRes, userRes]) => {
      if (activityRes.result.success && userRes.result.success) {
        const activity = activityRes.result.activity
        const userInfo = userRes.result.userInfo
        const now = new Date()
        const completionDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

        this.setData({
          activity,
          userInfo,
          completionDate,
          loading: false
        })

        // 延迟保存证书到用户记录
        setTimeout(() => {
          this.saveCertificateRecord()
        }, 1000)
      } else {
        this.setData({ loading: false })
        wx.showToast({ title: '生成证书失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('生成证书失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '生成证书失败', icon: 'none' })
    })
  },

  // 获取活动信息
  getActivityInfo() {
    return wx.cloud.callFunction({
      name: 'getActivity',
      data: {
        activityId: this.activityId
      }
    })
  },

  // 获取用户信息
  getUserInfo() {
    return wx.cloud.callFunction({
      name: 'getUserInfo'
    })
  },

  // 保存证书记录到用户数据
  saveCertificateRecord() {
    wx.cloud.callFunction({
      name: 'saveCertificate',
      data: {
        activityId: this.activityId
      }
    }).catch(err => {
      console.error('保存证书记录失败:', err)
    })
  },

  // 保存证书为图片
  saveCertificate() {
    wx.showLoading({ title: '保存中...' })

    // 获取证书区域的节点信息
    wx.createSelectorQuery().select('.certificate-card').boundingClientRect((rect) => {
      const width = rect.width
      const height = rect.height

      // 创建画布
      const canvas = wx.createCanvasContext('certificateCanvas')
      
      // 设置画布大小
      wx.createSelectorQuery().select('#certificateCanvas').fields({
        size: true
      }, (res) => {
        const dpr = wx.getSystemInfoSync().pixelRatio
        canvas.scale(dpr, dpr)

        // 绘制证书背景
        canvas.fillStyle = '#ffffff'
        canvas.fillRect(0, 0, width, height)

        // 这里可以添加更详细的画布绘制逻辑
        // 由于小程序限制，实际项目中可能需要使用云函数生成图片

        // 绘制完成后保存图片
        canvas.draw(false, () => {
          wx.canvasToTempFilePath({
            canvasId: 'certificateCanvas',
            x: 0,
            y: 0,
            width: width,
            height: height,
            destWidth: width * dpr,
            destHeight: height * dpr,
            success: (res) => {
              wx.hideLoading()
              wx.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
                success: () => {
                  wx.showToast({ title: '保存成功', icon: 'success' })
                },
                fail: () => {
                  wx.showToast({ title: '保存失败', icon: 'none' })
                }
              })
            },
            fail: () => {
              wx.hideLoading()
              wx.showToast({ title: '生成图片失败', icon: 'none' })
            }
          })
        })
      }).exec()
    }).exec()
  },

  // 分享证书
  shareCertificate() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 返回活动页面
  goBack() {
    wx.navigateBack()
  },

  // 分享到好友
  onShareAppMessage() {
    return {
      title: `我完成了${this.data.activity.name}活动，获得了城市漫游者证书！`,
      path: `/pages/certificate/certificate?activityId=${this.activityId}`,
      imageUrl: 'https://via.placeholder.com/500x400?text=城市漫游者证书'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: `我完成了${this.data.activity.name}活动，获得了城市漫游者证书！`,
      imageUrl: 'https://via.placeholder.com/500x400?text=城市漫游者证书'
    }
  }
})