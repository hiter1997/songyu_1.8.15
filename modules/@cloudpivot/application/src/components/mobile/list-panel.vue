<template>
  <div class="app-list">
    <empty v-if="isEmpty"/>
    <div class="app-list__container" v-else>
      <h3-scroll
        ref="scroll"
        :loadMore="loadMore"
        :pageSize="pageSize">
        <!-- 最近使用 -->
        <biz-models
          class="app-list__recent"
          :title="$t('cloudpivot.application.mobile.RecentlyUsed')"
          :list="recentBizModel"
          :collapsable="true"
          :col="4"
          @onItem="goFormList"
        />
      
        <div class="app-list__wrap">
          <apps-list
            :list="appList"
            colorKey="code"
            displayName="displayName"
            @toggle="selectSideItem"
          />
          <!-- <side-bar
            :staticStyle="true"
            :list="appList"
            :current="currentIdx"
            displayName="displayName"
            @toggle="selectSideItem"
          />
          <app-content
            class="app-list__content"
            v-if="currentApp"
            :app="currentApp"
          /> -->
        </div>
      </h3-scroll>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Mixins } from 'vue-property-decorator';

import { Mutation } from 'vuex-class';

import mobile from '@cloudpivot/form/src/renderer/components/mobile';

import OpenFormMixin from './open-form';

import { listApi } from '@cloudpivot/api';

import common from '@cloudpivot/common/mobile';

// import AppContent from './app-content.vue';

import BizModels from './app-models.vue';

@Component({
  name: 'app-list',
  components: {
    Empty: common.components.Empty,
    // SideBar: common.components.Sidebar,
    AppsList: common.components.AppsList,
    // AppContent,
    BizModels,
    H3Scroll: mobile.H3Scroll,
  },
})
export default class AppList extends Mixins(OpenFormMixin) {
  @Mutation('setAppName') setAppName!: any;

  // loading: boolean = true;

  isEmpty: boolean = false;

  appList: any[] = [];

  recentBizModel: any[] = [];

  activeCode: string = '';

  currentApp: any = null;

  currentIdx: number = 0;

  pageSize:number = 24;

  page: number = 1;

  sourceList:any = [];

  // 是否已加载过至少一次第一页数据
  firstTimeLoad: boolean = false;

  beforeMount() {
    
    this.getRecentBizModel();
  }

  async loadMore(page: any, done: any) {
    const vm: any = this;
    if (!vm.firstTimeLoad) {
      listApi.list({isMobile:true}).then((res: any) => {
        // console.log('应用列表： ', res);
        if (Array.isArray(res.data) && res.data.length) {
          vm.sourceList = res.data.map((item:any) => {
            item.displayName = common.utils.BusinessFunctions.getLangName(item);
            return item
          });
          vm.appList = vm.sourceList.slice(0, vm.pageSize);
          vm.$emit('setAppList', vm.sourceList);
          // 这块代码不知作用-暂且保留
          // this.$nextTick(() => {
          //   const appcode: any = sessionStorage.getItem('modelSouceApp');
          //   if (appcode && res.data.some((app: any) => app.code === appcode)) {
          //     this.activeCode = appcode;
          //     this.selectApp(appcode);
          //     sessionStorage.removeItem('modelSouceApp');
          //   } else {
          //     this.activeCode = res.data[0].code;
          //     this.selectApp(this.activeCode);
          //   }
          //   this.load(true);
          // });
        } else {
          vm.isEmpty = true;
        }
        if (done) {
          done(vm.pageSize, vm.sourceList.length);
        }
        vm.firstTimeLoad = true;
      });
      return
    }
    vm.page = page.num;
    if (page.num === 1) {
      // this.appList = this.sourceList.slice(0, this.pageSize);
      if (done) {
        done(vm.pageSize, vm.sourceList.length);
      }
      return;
    }
    if (done) {
      const delay = setTimeout(() => {
        clearTimeout(delay);
        vm.appList = vm.appList.concat(vm.sourceList.slice((vm.page-1)*vm.pageSize, vm.page*vm.pageSize));
        done(vm.pageSize, vm.sourceList.length);
      }, 500);
    }
  }

  getRecentBizModel() {

    listApi.listRecentBizModel().then((res: any) => {
      // console.log('最近使用的模型', res);
      if (Array.isArray(res.data) && res.data.length) {
        /* NOTE: 最多展示4个模型 */
        this.recentBizModel = res.data.filter(Boolean).slice(0, 4);
      }
    });
  }

  // selectApp(code: string) {
  //   /* 选中了一个应用 */
  //   // console.log('currentApp:', code);
  //   /* 获取应用的详情 */
  //   // listApi.getAppF
  //   const params = {
  //     appCode: code,
  //     isMobile: true
  //   }
  //   listApi.getFolder(params).then((res: any) => {
  //     // console.log('应用的信息', res);
  //     if (!Array.isArray(res.data)) {
  //       return;
  //     }
  //     const item: any = this.appList.find((app: any, idx: number) => {
  //       if (app.code === code) {
  //         this.currentIdx = idx;
  //         return app;
  //       }
  //     });
  //     // 目录数据
  //     const folders: Array<any> = res.data.filter((biz: any) => biz.type === 'Folder' && biz.children && biz.children.length);
  //     // 应用下直接挂载的业务模型
  //     const bizModels: Array<any> = res.data.filter((biz: any) => ['BizModel', 'Page', 'Report'].includes(biz.type));

  //     const appData: any = {
  //       title: item ? common.utils.BusinessFunctions.getLangName(item) : '',
  //       code: item ? item.code : '',
  //       list: []
  //     };
  //     if (bizModels.length) {
  //       appData.list = [
  //         {
  //           children: bizModels,
  //           type: null
  //         },
  //         ...folders
  //       ];
  //     } else {
  //       appData.list = folders;
  //     }
  //     this.currentApp = appData;
  //   });
  // }

  selectSideItem(app: any) {
    this.activeCode = app.code;
    // this.selectApp(app.code);
    // 跳转应用详情
    const name = common.utils.BusinessFunctions.getLangName(app);
    this.setAppName(name);
    this.$emit('goAppItem', app.code);
  }
}
</script>

<style lang="less" scoped>
@import "~@cloudpivot/common/styles/mixins.less";
.app-list {
  display: flex;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  overflow: hidden;
  /deep/.empty {
    width: 100%;
    text-align: center;
  }
  &__container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    /deep/.mescroll {
      height: auto;
      .px2rem(top, 88px);
      .px2rem(bottom, 100px);
    }
  }
  &__recent {
      flex: none;
      margin-top: 0;
      border-radius: 0;
      position: relative;
      .hairline("top", #e6ebf6);
    }
  &__wrap {
    flex: 1;
    display: flex;
    align-items: flex-start;
    width: 100%;
    background: #fff;
  }
  &__content {
    flex: 1;
    height: 100%;
    overflow-y: auto;
  }
}
</style>
