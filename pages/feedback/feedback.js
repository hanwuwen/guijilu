// feedback.js
Page({
  data: {
    feedbackTypes: [
      { label: '功能建议', value: 'suggestion' },
      { label: 'bug报告', value: 'bug' },
      { label: '使用问题', value: 'question' },
      { label: '其他', value: 'other' }
    ],
    selectedType: 'suggestion',
    content: '',
    contact: '',
    submitting: false
  },

  selectType(e) {
    this.setData({
      selectedType: e.currentTarget.dataset.value
    })
  },

  onContentInput(e) {
    this.setData({
      content: e.detail.value
    })
  },

  onContactInput(e) {
    this.setData({
      contact: e.detail.value
    })
  },

  submitFeedback(e) {
    const { content, selectedType, contact } = this.data

    if (!content.trim()) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })

    wx.cloud.callFunction({
      name: 'submitFeedback',
      data: {
        content: content.trim(),
        type: selectedType,
        contact: contact.trim()
      }
    }).then(res => {
      this.setData({ submitting: false })

      if (res.result.success) {
        wx.showToast({
          title: '反馈提交成功',
          icon: 'success'
        })

        // 重置表单
        this.setData({
          content: '',
          contact: '',
          selectedType: 'suggestion'
        })

        // 3秒后返回上一页
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: '反馈提交失败，请重试',
          icon: 'none'
        })
      }
    }).catch(err => {
      console.error('提交反馈失败:', err)
      this.setData({ submitting: false })
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })
    })
  }
})