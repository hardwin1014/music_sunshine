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
