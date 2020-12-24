
import Vue from 'vue';
import Router from 'vue-router';

import VueHtmlToPaper from 'vue-html-to-paper';

import App from './App.vue';
import store from './store';
import i18n from './config/i18n';
import axios from 'axios';

// // 引入自定义指令
// import directives from './directives';

import env from '@/config/env';

import OAuthApi from '@/apis/oauth';
import common from '@cloudpivot/common';

import routes from './routes';

import * as platform from '@cloudpivot/platform';


import './config/api';
import './config/antd';

import './styles/index.less';

let importReportService = false;

/**
 * 页面禁用拖拽上传时 浏览器默认打开图片
 */
document.addEventListener('drop', function (e) {
    e.preventDefault()
}, false)

document.addEventListener('dragover', function (e) {
    e.preventDefault()
}, false)


export async function startup(environment: any) {

    // 地址参数上携带access_token的，将token存在localstorage并清理地址上的参数
    if (environment && environment.access_token) {
        // 通过token获取refresh_token，实现token续期
        await axios.post(`${env.apiHost}/login/Authentication/get_refresh_token`, { access_token: environment.access_token }).then((res: any) => {
            if (res.errcode === 0 && res.data) {
                const refresh_tokens = (res as any).data.refresh_token;
                let expireTime = (res as any).data.expiration;

                // 时间戳如果为13位则单位是ms,把单位转为s
                if (expireTime.toString().length === 13) {
                    expireTime = expireTime.toString().slice(0, -3);
                }
        
                localStorage.setItem('refresh_token', refresh_tokens);
                localStorage.setItem('expireTime', expireTime);
            }
        });
        //打开表单详情时不清理access_token, 原因为 解决钉钉打开流程表单点击同意后不关闭页面问题
        if(!window.location.href.includes('/form/detail?')){
            const url = decodeURIComponent(window.location.href).replace('&access_token', 'access_token');
            window.location.href = url.replace(`access_token=${environment.access_token}`, '');   
        }
    }

    window.Environment = environment;
    window.Environment.isIe = /Trident/.test(navigator.userAgent);

    Vue.config.productionTip = false;
    Vue.use(Router);

    Vue.use(VueHtmlToPaper);

    // 单应用路由
    if (window.Environment.appCode) {
        ((routes[0]) as any).redirect = '/app-home';
    } else if (window.Environment.messageId) {
        // 消息路由
    }

    const router = new Router({
        mode: 'history',
        base: process.env.BASE_URL,
        routes
    });

    Vue.prototype.router = router;
    
    const {
        oauthHost,
        client_id,
        scope,
        secret,
        redirectHost
    } = env;
    var getTokenParams: any = {
        code: '',
        url: oauthHost,
        client_secret: secret,
        client_id: client_id,
        redirect_uri: `${redirectHost}/oauth`
    };
    router.beforeEach(async (to: any, from: any, next: any) => {
        if(location.href.includes('isfromApp')){
            const result = await OAuthApi.getRsaKey();
            const { index, key } = result;
            const password:any = common.utils.RsaEncrypt('123456', key);
            // rsa加密结束
            const params = {
                username: 'demouser1',
                password,
                url: 'http://8.129.187.214/api/login?redirect_uri=http%3A%2F%2F8.129.187.214%2Fapi%2Foauth%2Fauthorize%3Fclient_id%3Dapi%26response_type%3Dcode%26scope%3Dread%26redirect_uri%3Dhttp%3A%2F%2F8.129.187.214%2Foauth',
                portal: true,
                index,
                corpId: 'main'
            };
            const res = await OAuthApi.login(params);
            if (res.errcode === 200 && res.code) {
                getTokenParams.code = res.code;
            }
            const res1 = await OAuthApi.getToken(getTokenParams);
            if (res1 && res1.success) {
                const token = (res1 as any).access_token;
                const refresh_tokens = (res1 as any).refresh_token;
                const expireTime = (res1 as any).exp;

                localStorage.setItem('refresh_token', refresh_tokens);
                localStorage.setItem('expireTime', expireTime);
                localStorage.setItem('token', token); 
            }
        }


        let title = '奥哲云枢';
        if (to.meta && to.meta.title) {
            title = to.meta.title
        }
        platform.service.setTitle(title);
        if(to.name === 'appReport' && !importReportService){
            importReportService = true;
            import('@/views/applications/report-service');
        }
        if(to.name === 'applicationReport' && !importReportService){
            importReportService = true;
            import('@/views/applications/report-service');
        }

        if(to.name === 'applicationReport' && !importReportService){
            importReportService = true;
            import('@/views/applications/report-service');
        }

        const token = localStorage.getItem('token');

        if (env.enableProxy) {
            next();
        } else {
            // document.title = to.meta.title;
            if (!token && to.name !== 'login' && to.name !== 'oauth') {
                // alert(JSON.stringify(to));
                // window.location.href = '/login';
                next({ name: 'login' });
            } else {
                next();
            }
        }
    });

    // 全局注册自定义指令
    // Object.entries(directives).forEach((directive: any) => {
    //     const directiveName = directive[0];
    //     const directiveFunc = directive[1];
    //     Vue.directive(directiveName, directiveFunc);
    // });

    new Vue({
        router,
        i18n,
        store,
        render: (h: any) => h(App),
    }).$mount('#app');

}