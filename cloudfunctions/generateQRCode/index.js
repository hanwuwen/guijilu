// generateQRCode/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  try {
    const { content } = event

    if (!content) {
      return {
        success: false,
        error: '参数不完整'
      }
    }

    // 生成二维码
    const result = await cloud.openapi.wxacode.createQRCode({
      path: `/pages/activity/activity?id=${content}`,
      width: 430,
      autoColor: true,
      isHyaline: false
    })

    // 上传二维码到云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: `qrcodes/${Date.now()}.png`,
      fileContent: result.buffer
    })

    // 获取二维码的临时链接
    const downloadResult = await cloud.getTempFileURL({
      fileList: [uploadResult.fileID]
    })

    return {
      success: true,
      qrcode: downloadResult.fileList[0].tempFileURL
    }
  } catch (error) {
    console.error('生成二维码失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}