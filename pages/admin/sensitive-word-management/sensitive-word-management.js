// sensitive-word-management.js
Page({
  data: {
    // 敏感词分类
    categories: ['政治', '色情', '暴力', '赌博', '毒品', '广告', '其他'],
    
    // 新敏感词表单
    newWord: {
      word: '',
      categoryIndex: 0
    },
    
    // 搜索和过滤
    searchKeyword: '',
    filterCategoryIndex: 0,
    
    // 敏感词列表
    words: [],
    total: 0,
    page: 1,
    pageSize: 20,
    
    // 加载状态
    loading: false
  },

  onLoad() {
    this.loadSensitiveWords()
  },

  // 加载敏感词列表
  loadSensitiveWords() {
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'manageSensitiveWords',
      data: {
        action: 'list',
        data: {
          page: this.data.page,
          pageSize: this.data.pageSize,
          category: this.data.filterCategoryIndex > 0 ? this.data.categories[this.data.filterCategoryIndex - 1] : ''
        }
      }
    }).then(res => {
      this.setData({ loading: false })
      if (res.result.success) {
        this.setData({
          words: res.result.words,
          total: res.result.total
        })
      } else {
        wx.showToast({ title: res.result.error || '加载失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('加载敏感词失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  // 敏感词输入
  onWordInput(e) {
    this.setData({
      'newWord.word': e.detail.value
    })
  },

  // 分类选择
  onCategoryChange(e) {
    this.setData({
      'newWord.categoryIndex': e.detail.value
    })
  },

  // 添加敏感词
  addSensitiveWord() {
    const { word, categoryIndex } = this.data.newWord
    const category = this.data.categories[categoryIndex]
    
    if (!word) {
      wx.showToast({ title: '请输入敏感词', icon: 'none' })
      return
    }
    
    wx.cloud.callFunction({
      name: 'manageSensitiveWords',
      data: {
        action: 'add',
        data: {
          word,
          category
        }
      }
    }).then(res => {
      if (res.result.success) {
        wx.showToast({ title: '添加成功' })
        this.setData({
          'newWord.word': '',
          'newWord.categoryIndex': 0
        })
        this.loadSensitiveWords()
      } else {
        wx.showToast({ title: res.result.error || '添加失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('添加敏感词失败:', err)
      wx.showToast({ title: '添加失败', icon: 'none' })
    })
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  // 搜索敏感词
  searchWords() {
    this.setData({ page: 1 })
    this.loadSensitiveWords()
  },

  // 过滤分类选择
  onFilterCategoryChange(e) {
    this.setData({ 
      filterCategoryIndex: e.detail.value,
      page: 1 
    })
    this.loadSensitiveWords()
  },

  // 编辑敏感词
  editWord(e) {
    const wordId = e.currentTarget.dataset.id
    const word = this.data.words.find(w => w._id === wordId)
    
    if (word) {
      wx.showModal({
        title: '编辑敏感词',
        editable: true,
        placeholderText: '请输入敏感词',
        defaultText: word.word,
        success: (res) => {
          if (res.confirm && res.content) {
            this.updateSensitiveWord(wordId, res.content, word.category)
          }
        }
      })
    }
  },

  // 更新敏感词
  updateSensitiveWord(wordId, newWord, category) {
    wx.cloud.callFunction({
      name: 'manageSensitiveWords',
      data: {
        action: 'update',
        data: {
          wordId,
          word: newWord,
          category
        }
      }
    }).then(res => {
      if (res.result.success) {
        wx.showToast({ title: '更新成功' })
        this.loadSensitiveWords()
      } else {
        wx.showToast({ title: res.result.error || '更新失败', icon: 'none' })
      }
    }).catch(err => {
      console.error('更新敏感词失败:', err)
      wx.showToast({ title: '更新失败', icon: 'none' })
    })
  },

  // 删除敏感词
  deleteWord(e) {
    const wordId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '删除敏感词',
      content: '确定要删除这个敏感词吗？',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'manageSensitiveWords',
            data: {
              action: 'delete',
              data: {
                wordId
              }
            }
          }).then(res => {
            if (res.result.success) {
              wx.showToast({ title: '删除成功' })
              this.loadSensitiveWords()
            } else {
              wx.showToast({ title: res.result.error || '删除失败', icon: 'none' })
            }
          }).catch(err => {
            console.error('删除敏感词失败:', err)
            wx.showToast({ title: '删除失败', icon: 'none' })
          })
        }
      }
    })
  },

  // 上一页
  prevPage() {
    if (this.data.page > 1) {
      this.setData({ page: this.data.page - 1 })
      this.loadSensitiveWords()
    }
  },

  // 下一页
  nextPage() {
    if (this.data.page * this.data.pageSize < this.data.total) {
      this.setData({ page: this.data.page + 1 })
      this.loadSensitiveWords()
    }
  }
})