import axios from 'axios'
import type { ApiResponse } from '@/types'

// 创建 axios 实例
const request = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 后续可在此添加 token 等认证信息
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse
    // 业务错误处理
    if (res.code !== 0) {
      console.error('请求错误:', res.message)
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return response.data
  },
  (error) => {
    // HTTP 错误处理
    const message = error.response?.data?.message || error.message || '网络异常'
    console.error('网络错误:', message)
    return Promise.reject(error)
  }
)

export default request
