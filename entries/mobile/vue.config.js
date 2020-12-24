const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const defaultCssVars = require('@cloudpivot/common/styles/variable').mobile;

const extendLessVars = require('./extends/theme');

const modifyVars = Object.assign({}, defaultCssVars, extendLessVars);


let pages = {
  main: {
    entry: 'src/main.ts',
    template: 'public/index.html',
    filename: 'index.html',
  },
  externalLink: {
    entry: 'src/views/externalLink/apps.ts',
    template: 'src/views/externalLink/el.html',
    filename: 'el.html',
  }
};

module.exports = {
  publicPath: '/mobile/',
  pages,
  filenameHashing: true,
  productionSourceMap: true,
  // 处理IE兼容————vuex持久化脚本语法转译
  transpileDependencies: ['vuex-persist', 'flatted','ansi-regex'], // /@cloudpivot\/[\w-]+/],
  configureWebpack: config => {

  },
  devServer: {
    port: 8089,
    open: false,
    disableHostCheck: true,
    proxy: {
      '/api/': {
        target: process.env.VUE_APP_API + '/',
        // target:  'http://47.106.247.123:8080/',
        // target: 'http://rap2api.taobao.org/',
        changeOrigin: true,
        // pathRewrite: {
        //   '^/api': '', // app/mock/94968
        // },
      },
      '/externalLink/': {
        target: process.env.VUE_APP_API + '/',
        changeOrigin: true,
      },
      '/apis/': {
        target: process.env.VUE_APP_OAUTH_HOST + '/',
        changeOrigin: true,
        pathRewrite: {
          '^/apis': ''
        },
      },
      '/v1/': {
        target: process.env.VUE_APP_PORTAL_HOST + '/',
        changeOrigin: true,
      }
    },
    before: (app) => {
      app.all('*', function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With');
        res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
        res.header('X-Powered-By', '3.2.1');
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
        } else {
          next();
        }
      })
    }
  },

  css: {
    loaderOptions: {
      less: {
        modifyVars: modifyVars,
        javascriptEnabled: true
      },
    },
  },
  chainWebpack: config => {
    config.resolve.alias
      .set('assets', path.resolve(__dirname, './src/assets'))
      .set('styles', path.resolve(__dirname, './src/styles'));
      
      // 删除预加载, preload删除方式一样
      ['main', 'externalLink'].map(name => config.plugins.delete(`prefetch-${name}`))  

      // 优化打包
      config.optimization
      .splitChunks({
        minSize: 300000,
        maxInitialRequests: 6
      })

    // 配置打包分析
    // if (process.env.npm_config_report) {
    // config
    //   .plugin('webpack-bundle-analyzer')
    //   .use(BundleAnalyzerPlugin)
    // }
  }
};
