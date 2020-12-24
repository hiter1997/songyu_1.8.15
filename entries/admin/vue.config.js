const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const themeVars = require('@h3/theme-pc/presets/cloudpivot/back');

const defaultCssVars = require('@cloudpivot/common/styles/variable').admin;

const extendLessVars = require('./extends/theme');

const modifyVars = Object.assign({}, defaultCssVars, extendLessVars);

themeVars.modifyVars = Object.assign(themeVars.modifyVars, modifyVars)

const CopyWebpackPlugin = require('copy-webpack-plugin');


let pages = {
  main: {
    entry: 'src/main.ts',
    template: 'public/index.html',
    filename: 'index.html'

  },
  template: {
    entry: 'src/template/index.ts'
  }
};
if (process.env.NODE_ENV === 'debug') {
  // pages.template = Object.assign(pages.template,{
  //     template: 'src/template/index.html', //开发环境页面
  //     filename: 'template.html'
  // });
  /**
   * 开发环境的ROOT模板测试路径
   */
  pages.rooTemplate = {
    entry: 'src/template/index.ts',
    template: 'src/template/rootTemplate.html',
    filename: 'rootTemplate.html'
  };
}


module.exports = {
  publicPath: '/admin/',
  pages: pages,
  parallel: false,
  filenameHashing: false,
  productionSourceMap: true,
  transpileDependencies: ['vuex-persist', 'flatted','ansi-regex'],// /@cloudpivot\/[\w-]+/],
  configureWebpack: config => {

    return {
      plugins: [
        new MonacoWebpackPlugin({
          languages: ["javascript", "css", "html", "json"]
        }),
        new CopyWebpackPlugin([
          {
            from: path.resolve(__dirname, '../../modules/@cloudpivot/form/src/renderer/components/pc/input-textarea/tinymcelib'),
            to: 'tinymcelib',
            ignore: ['.*']
          }
        ])
      ]
    };
  },
  devServer: {
    port: 9000,
    open: true,
    proxy: {
      '/api/': {
        target: process.env.VUE_APP_API + '/',
        changeOrigin: true,
        // pathRewrite: {
        //   '^/api': '', // app/mock/94968
        // },
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
        if (req.method == 'OPTIONS') {
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
        ...themeVars,
        modifyVars: modifyVars,
        javascriptEnabled: true,
      },
    },
  },
  chainWebpack: config => {
    config.resolve.alias
      .set('assets', path.resolve(__dirname, './src/assets'))
      .set('styles', path.resolve(__dirname, './src/styles'))

    // 配置打包分析
    if (process.env.npm_config_report) {
      config
        .plugin('webpack-bundle-analyzer')
        .use(BundleAnalyzerPlugin)
    }
    // 删除预加载
    ['main', 'template', 'rooTemplate'].map(name => config.plugins.delete(`prefetch-${name}`))

    config.module
      .rule('images')
      .use('url-loader')
      .loader('url-loader')
      .tap(options => Object.assign(options, { limit: 1024 }))

    // 优化打包
    config.optimization
    .splitChunks({
      minSize: 300000,
      maxInitialRequests: 6
    })

    // config.module.rule('ts').use('ts-loader').tap(options => Object.assign(options, {
    //   getCustomTransformers: () => ({
    //     before: [ tsImportPluginFactory([
    //       {
    //         libraryName: 'h3-awesome-ui',
    //         libraryDirectory: 'lib',
    //         style: true,
    //       }])]
    //   }),
    //   // include: path.join(__dirname, 'node_modules/h3-antd-pro/components'),
    // }));


  }
};
