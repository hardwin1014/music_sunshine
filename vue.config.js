const registerRouter = require('./backend/router')

module.exports = {
  productionSourceMap: false,
  // publicPath: process.env.NODE_ENV === 'production' ? './music-next/' : './',
  publicPath: './',
  outputDir: 'dist',
  lintOnSave: true,
  runtimeCompiler: true,
  css: {
    loaderOptions: {
      sass: {
        // 全局引入变量和 mixin
        additionalData: `
          @import "@/assets/scss/variable.scss";
          @import "@/assets/scss/mixin.scss";
        `
      }
    }
  },
  devServer: {
    // app是express的一个实例
    before(app) {
      registerRouter(app)
    },
    host: '127.0.0.1', // 本地地址
    port: 8084, // 端口号
    open: true, // 配置项目在启动时自动在浏览器打开
    proxy: {
      '/music-next/': {
        // '/api'是代理标识，一般是每个接口前的相同部分
        target: 'http://ustbhuangyi.com', // 请求地址，一般是服务器地址
        changeOrigin: true, // 是否进行跨域
        pathRewrite: {
          // pathRewrite的作用是把请求接口中的 '/api'替换掉，一般是替换为空""
          '^/api': ''
        }
      }
    }
  },
  configureWebpack: (config) => {
    if (process.env.npm_config_report) {
      const BundleAnalyzerPlugin =
        require('webpack-bundle-analyzer').BundleAnalyzerPlugin
      config.plugins.push(new BundleAnalyzerPlugin())
    }
  }
}
