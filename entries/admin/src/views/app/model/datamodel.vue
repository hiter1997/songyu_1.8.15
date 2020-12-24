<template>
  <div class="data-model">
    <div class="data-model-content">
      <div class="tabs">
        <a-tabs :animated="false" v-model="activeKey" @change="tabsChange">
          <a-tab-pane :tab="$t('languages.Apps.DataModel')" :key="TabPaneNames.TabDataModel">
            <DataItem :bizSchemaCode="bizSchemaCode"></DataItem>
          </a-tab-pane>
          <a-tab-pane v-if="onlyLook" :tab="'业务规则'" key="6">
            <BizRuleList />
          </a-tab-pane>
          <a-tab-pane v-if="!onlyLook" :tab="$t('languages.Apps.BizMethod')" key="2">
            <BizMethod :bizSchemaCode="bizSchemaCode" />
          </a-tab-pane>
          <a-tab-pane v-if="!onlyLook" :tab="$t('languages.Apps.DataRule')" key="3">
            <DataRule :bizSchemaCode="bizSchemaCode" />
          </a-tab-pane>
          <a-tab-pane
            :tab="$t('languages.Apps.DataPermission')"
            :key="TabPaneNames.TabDataPermission"
          >
            <DataPermission ref="dataPermission" :bizSchemaCode="bizSchemaCode" />
          </a-tab-pane>
          <a-tab-pane v-if="!onlyLook" :tab="$t('languages.Apps.MessageReminder')" key="5">
            <message-reminder v-if="activeKey === '5'" :bizSchemaCode="bizSchemaCode" />
          </a-tab-pane>
        </a-tabs>
        <div class="switch-btn">
          <!-- <a-button v-if="onlyLook" @click="openModal">
            <span class="icon aufontAll">&#xe616;</span> 返回旧版本
          </a-button>
          <a-button v-else @click="openModal">
            <span class="icon aufontAll">&#xe897;</span>
            启用新版
          </a-button> -->
        </div>
      </div>
    </div>
    <a-modal
      v-model="visible"
      :title="title"
      @ok="handleOk"
      @cancel="close"
      :width="552"
      :wrapClassName="'modal-swith-wrap'"
    >
      <a-radio-group v-model="value" class="switch-radio">
        <a-radio class="switch-radio-item" :value="1">{{ onlyReadTips }}</a-radio>
        <a-radio class="switch-radio-item" :value="2">{{ readAndWriteTips }}</a-radio>
      </a-radio-group>

      <a-alert :message="warningMsg" type="warning" showIcon />
    </a-modal>
  </div>
</template>

<script lang='ts'>
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { State, Action, Mutation, namespace } from "vuex-class";
import DataItem from "@/components/apps/model/dataitem.vue";
import BizMethod from "@/views/app/biz-method/index.vue";
import DataRule from "@/views/app/data-rule/index.vue";
import DataPermission from "@/views/app/data-permission/index.vue";
import MessageReminder from "@/views/app/message-reminder/index.vue";
import BizRuleList from "@/views/app/model/biz-rule-list.vue";

import { bizpropertyApi } from "@cloudpivot/api";

export enum TabPaneNames {
  TabDataModel = "1",
  TabBizMethod = "2",
  TabDataRule = "3",
  TabDataPermission = "4",
  TabMessageReminder = "5"
}

@Component({
  name: "DataModel",
  components: {
    DataItem,
    BizMethod,
    DataRule,
    DataPermission,
    MessageReminder,
    BizRuleList
  }
})
export default class DataModel extends Vue {
  @Prop({
    type: String
  })
  bizSchemaCode!: string;

  activeKey = "1";
  // 模型是否开启
  isNew = true;
  // 查看状态开启
  onlyLook = true;

  visible = false;

  TabPaneNames: any = TabPaneNames;

  openModal() {
    this.visible = true;
  }

  getModelState() {
    if (!this.bizSchemaCode) {
      return;
    }
    const params = {
      schemaCode: this.bizSchemaCode
    };
    bizpropertyApi.getBusinessRuleEnable(params).then(res => {
      if (res.errcode === 0) {
        this.isNew = res.data;
        this.onlyLook = this.isNew;
        let query: any = this.$route.query;
        if (query && query.tabsIndex) {
          this.activeKey = query.tabsIndex;
          const oldBiz = ["2", "3", "5"];
          if (this.isNew && oldBiz.includes(query.tabsIndex)) {
            this.activeKey = "1";
            this.tabClick();
          }
          if (!this.isNew && query.tabsIndex === "6") {
            this.activeKey = "1";
            this.tabClick();
          }
        }
      }
    });
  }

  mounted() { 
    let query: any = this.$route.query;
    if (query && query.tabsIndex) {
      this.activeKey = query.tabsIndex;
      const oldBiz = ["2", "3", "5"];
      if (this.isNew && oldBiz.includes(query.tabsIndex)) {
        this.activeKey = "1";
        this.tabClick();
      }
      if (!this.isNew && query.tabsIndex === "6") {
        this.activeKey = "1";
        this.tabClick();
      }
    }
  }

  handleOk() {
    this.onlyLook = !this.onlyLook;
    if (this.value === 1) {
      this.modifyModelState(this.isNew);
    } else {
      this.modifyModelState(!this.isNew);
    }
    this.activeKey = "1";
    this.tabsChange(this.activeKey);
    this.close();
  }

  modifyModelState(val: boolean) {
    if (!this.bizSchemaCode) {
      return;
    }
    const params = {
      schemaCode: this.bizSchemaCode,
      enable: val
    };
    bizpropertyApi.setBusinessRuleEnable(params).then(res => {
      if (res.errcode === 0) {
        this.isNew = !this.isNew;
      }
    });
  }

  close() {
    this.visible = false;
  }

  value = 1;

  tabsChange(val: string) {
    if (val === TabPaneNames.TabDataPermission) {
      const dataPermission: any = this.$refs.dataPermission;
      if (dataPermission && dataPermission.reset) {
        dataPermission.reset();
      }
    }
    this.$router.push({
      name: "datamodel",
      query: { tabsIndex: this.activeKey }
    }).catch((err: any) => {err});
  }

  get onlyReadTips() {
    if (this.onlyLook) {
      return "仅查看旧版本业务方法、数据规则、消息通知";
    } else {
      return "仅查看新版本业务规则";
    }
  }

  get readAndWriteTips() {
    if (this.onlyLook) {
      return "查看并使用旧版业务方法、数据规则、消息通知";
    } else {
      return "查看并使用新版本业务规则";
    }
  }

  get title() {
    if (this.onlyLook) {
      return "返回旧版本";
    } else {
      return "启用新版本";
    }
  }

  get warningMsg() {
    if (this.onlyLook) {
      return "使用旧版本业务方法、数据规则、消息通知后，新版本业务规则将不再执行";
    } else {
      return "使用新版本业务规则后，旧的业务方法、数据规则、消息通知将不再执行并且不兼容旧数据，需要重新在业务规则中创建规则";
    }
  }
  created() {
    // 参数不合法强制跳转
    if (this.bizSchemaCode === "data") {
      this.$router.push({ path: "/apps" }).catch((err: any) => {err});
    }
  }

  tabClick() {
    this.$router.push({
      name: "datamodel",
      query: { tabsIndex: this.activeKey }
    }).catch((err: any) => {err});
  }
  // mounted() {
  //   // 根据路由传入的tab类型进行切换
  //   const query: any = this.$route.query;
  //   if (query && query.tab) {
  //     this.activeKey = query.tab;
  //   }
  // }
}
</script>
<style lang='less'>
.modal-swith-wrap {
  .switch-radio {
    .switch-radio-item {
      display: block;
      line-height: 32px;
    }
  }
  .ant-alert-warning {
    margin-top: 25px;
  }
}
.data-model {
  overflow: hidden;
  height: calc(100vh - 64px);
  .loading {
    height: 100%;
    position: relative;
    display: none;
    .ant-spin {
      position: absolute;
      top: 50%;
      margin-top: -40px;
    }
  }
  .data-model-content {
    .tabs {
      position: relative;
      .ant-tabs-nav-scroll {
        text-align: left;
        margin: 0px 24px;
        .ant-tabs-tab {
          padding: 16px 16px 12px 16px;
        }
      }
      .switch-btn {
        position: absolute;
        right: 24px;
        z-index: 100;
        top: 7px;
        .icon {
          margin-right: 8px;
        }
      }
    }
  }
}
</style>
