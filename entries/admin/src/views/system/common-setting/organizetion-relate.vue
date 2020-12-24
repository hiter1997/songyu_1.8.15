<template>
  <div class="organizetion-relate">
    <a-steps direction="vertical" :current="-1" class="common-setting__step">
      <a-step id="app-list0" v-if="syncOrgList.length < 0">
        <div slot="description">
          <img src="@/assets/images/nodata.png" alt="" />
          <p style="text-indent: 106px;">暂无关联组织，请联系管理员</p>
        </div>
      </a-step>
      <template v-else>
        
        <template v-if="syncParams.relatedType === 'DINGTALK' ||　syncParams.relatedType === 'OTHER'">
          
          <a-step id="app-list1">
            <div slot="description">
              <div class="guide">
                <div class="organizetion-relate__header">
                  <span>钉钉集成</span>
                  <span class="header__tips"
                    >组织机构同步使用，需在钉钉中自建应用，开通通讯录权限，并获取应用消息填写在下方</span
                  >
                  <slot name="settingTips" />
                </div>
                <div class="organizetion-relate__form">
                  <a-row class="organizetion-relate__item">
                    <a-col :span="layout.left" class="organizetion-relate__left">
                      <span class="required">*</span>
                      <span
                        >AppKey
                        <a-tooltip
                          :title="
                            'tips：创建的应用的唯一标识，获取地址：钉钉后台，工作台-自建应用--应用设置-基础信息，\
                                  可获取Appkey、APPSecret和AgentId'
                          "
                        >
                          <a-icon type="question-circle-o" /> </a-tooltip
                        >:
                      </span>
                    </a-col>
                    <a-col
                      :span="layout.right"
                      class="organizetion-relate__right"
                    >
                      <span class="organizetion-relate__right--edit">{{
                        syncParams.appkey
                      }}</span>
                    </a-col>
                  </a-row>

                  <a-row class="organizetion-relate__item">
                    <a-col :span="layout.left" class="organizetion-relate__left">
                      <span class="required">*</span>
                      <span>AppSecret:</span>
                    </a-col>
                    <a-col
                      :span="layout.right"
                      class="organizetion-relate__right"
                    >
                      <span class="organizetion-relate__right--edit">
                        <password-span
                          :value="syncParams.appSecret"
                          :fn="showSecret"
                        />
                      </span>
                    </a-col>
                  </a-row>

                  <a-row class="organizetion-relate__item">
                    <a-col :span="layout.left" class="organizetion-relate__left">
                      <span class="required">*</span>
                      <span>AgentId:</span>
                    </a-col>
                    <a-col
                      :span="layout.right"
                      class="organizetion-relate__right"
                    >
                      <span class="organizetion-relate__right--edit">{{
                        syncParams.agentId
                      }}</span>
                    </a-col>
                  </a-row>

                  <a-row class="organizetion-relate__item">
                    <a-col :span="layout.left" class="organizetion-relate__left">
                      <span class="required">*</span>
                      <span>回调地址:</span>
                    </a-col>
                    <a-col
                      :span="layout.right"
                      class="organizetion-relate__right"
                    >
                      <span
                        class="organizetion-relate__right--edit"
                        v-if="isNotShowRU"
                      >
                        {{ syncParams.redirectUri }}
                      </span>
                    </a-col>
                  </a-row>
                </div>
              </div>
            </div>
          </a-step>
          <a-step id="app-list2">
            <div slot="description">
              <div class="guide">
                <div class="organizetion-relate__header">
                  <span>门户访问设置</span>
                  <span class="header__tips"
                    >门户钉钉扫码登录配置，若未配置，系统门户扫码不可用</span
                  >
                  <slot name="settingTips" />
                </div>
                <div class="organizetion-relate__form">
                  <a-row class="organizetion-relate__item">
                    <a-col :span="layout.left" class="organizetion-relate__left">
                      <span class="required">*</span>
                      <span
                        >CorpId
                        <a-tooltip
                          :title="
                            'tips：钉钉企业的唯一标识，获取地址：钉钉后台，工作台-自建应用-开发信息-开发账号管理-企业自用账号信息'
                          "
                        >
                          <a-icon type="question-circle-o" /> </a-tooltip
                        >:
                      </span>
                    </a-col>
                    <a-col
                      :span="layout.right"
                      class="organizetion-relate__right"
                    >
                      <span class="organizetion-relate__right--edit">{{
                        syncParams.corpId
                      }}</span>
                    </a-col>
                  </a-row>
                  <a-row class="organizetion-relate__item">
                    <a-col :span="layout.left" class="organizetion-relate__left">
                      <span class="required">*</span>
                      <span
                        >SSOSecret
                        <a-tooltip
                          :title="
                            'tips：钉钉企业的唯一标识，获取地址：钉钉后台，工作台-自建应用-开发信息-开发账号管理-企业自用账号信息'
                          "
                        >
                          <a-icon type="question-circle-o" /> </a-tooltip
                        >:
                      </span>
                    </a-col>
                    <a-col
                      :span="layout.right"
                      class="organizetion-relate__right"
                    >
                      <span class="organizetion-relate__right--edit">{{
                        syncParams.corpSecret
                      }}</span>
                    </a-col>
                  </a-row>
                  <a-row class="organizetion-relate__item">
                    <a-col :span="layout.left" class="organizetion-relate__left">
                      <span class="required">*</span>
                      <span>扫码登录 appID</span>
                    </a-col>
                    <a-col
                      :span="layout.right"
                      class="organizetion-relate__right"
                    >
                      <span class="organizetion-relate__right--edit">{{
                        syncParams.scanAppId
                      }}</span>
                    </a-col>
                  </a-row>

                  <a-row class="organizetion-relate__item">
                    <a-col :span="layout.left" class="organizetion-relate__left">
                      <span class="required">*</span>
                      <span>
                        扫码登录 appSecret :
                      </span>
                    </a-col>
                    <a-col
                      :span="layout.right"
                      class="organizetion-relate__right"
                    >
                      <span class="organizetion-relate__right--edit">
                        <password-span
                          :value="syncParams.scanAppSecret"
                          :fn="showSecret"
                        />
                      </span>
                    </a-col>
                  </a-row>
                  <a-row class="check-dingtalk__item" v-if="isSuperAdmin">
                    <a-col
                      :span="layout.left"
                      class="check-dingtalk__left"
                    ></a-col>
                    <a-col :span="layout.right" class="check-dingtalk__right">
                      <div class="btn-group">
                        <a-button
                          type="primary"
                          class="btn-group__btn"
                          @click="() => (this.showAddDepart = true)"
                          >编辑</a-button
                        >
                      </div>
                    </a-col>
                  </a-row>
                </div>
              </div>
            </div>
          </a-step>

        </template>

        <template v-else-if="syncParams.relatedType === 'WECHAT'">
          <a-step id="app-list1">
            <div slot="description">
              <div class="guide">
                <div class="organizetion-relate__header">
                  <span>微信集成</span>
                </div>
                <div class="organizetion-relate__form">
                  <a-row class="organizetion-relate__item">
                    <a-col :span="layout.left" class="organizetion-relate__left">
                      <span class="required">*</span>
                      <span>CorpId:</span>
                    </a-col>
                    <a-col
                      :span="layout.right"
                      class="organizetion-relate__right"
                    >
                      <span class="organizetion-relate__right--edit">{{
                        syncParams.corpId
                      }}</span>
                    </a-col>
                  </a-row>

                  <a-row class="organizetion-relate__item">
                    <a-col :span="layout.left" class="organizetion-relate__left">
                      <span class="required">*</span>
                      <span>Provider_Secret:</span>
                    </a-col>
                    <a-col
                      :span="layout.right"
                      class="organizetion-relate__right"
                    >
                      <span class="organizetion-relate__right--edit">
                        <password-span
                          :value="syncParams.corpSecret"
                          :fn="showSecret"
                        />
                      </span>
                    </a-col>
                  </a-row>

                  <a-row class="organizetion-relate__item">
                    <a-col :span="layout.left" class="organizetion-relate__left">
                      <span class="required">*</span>
                      <span>AppSecret:</span>
                    </a-col>
                    <a-col
                      :span="layout.right"
                      class="organizetion-relate__right"
                    >
                      <span class="organizetion-relate__right--edit">
                        <password-span
                          :value="syncParams.appSecret"
                          :fn="showSecret"
                        />
                      </span>
                    </a-col>
                  </a-row>

                  <a-row class="organizetion-relate__item">
                    <a-col :span="layout.left" class="organizetion-relate__left">
                      <span class="required">*</span>
                      <span>AgentId:</span>
                    </a-col>
                    <a-col
                      :span="layout.right"
                      class="organizetion-relate__right"
                    >
                      <span class="organizetion-relate__right--edit">{{
                        syncParams.agentId
                      }}</span>
                    </a-col>
                  </a-row>

                  <a-row class="organizetion-relate__item">
                    <a-col :span="layout.left" class="organizetion-relate__left">
                      <span class="required">*</span>
                      <span>回调地址:</span>
                    </a-col>
                    <a-col
                      :span="layout.right"
                      class="organizetion-relate__right"
                    >
                      <span
                        class="organizetion-relate__right--edit"
                        v-if="isNotShowRU"
                      >
                        {{ syncParams.redirectUri }}
                      </span>
                    </a-col>
                  </a-row>

                  <a-row class="check-dingtalk__item" v-if="isSuperAdmin">
                    <a-col
                      :span="layout.left"
                      class="check-dingtalk__left"
                    ></a-col>
                    <a-col :span="layout.right" class="check-dingtalk__right">
                      <div class="btn-group">
                        <a-button
                          type="primary"
                          class="btn-group__btn"
                          @click="() => (this.showAddDepart = true)"
                          >编辑</a-button
                        >
                      </div>
                    </a-col>
                  </a-row>
                  
                </div>
              </div>
            </div>
          </a-step>
        </template>

      </template>

      <slot name="filerStorage" />
    </a-steps>
    <a-drawer
      title="编辑关联组织"
      :destroyOnClose="true"
      :visible="showAddDepart"
      @ok="closeAddDepart"
      @close="closeAddDepart"
      :width="860"
      wrapClassName="edit-relative-org-drawer"
    >
      <add-organization :info="syncParams" @close="closeAddDepart" />
    </a-drawer>
  </div>
</template>
<script lang="ts">
import { Component, Vue, PropSync, Prop } from "vue-property-decorator";
import { State, namespace, Mutation } from "vuex-class";
import systemApi from "@/apis/system/system-manager.api";
import PasswordSpan from "@/components/global/password-span.vue";
import AddOrganization from "./add-organization.vue";

import env from "@/env.ts";

const UserModule = namespace("System/User");

@Component({
  name: "organizetion-relate",
  components: {
    AddOrganization,
    PasswordSpan,
  },
})
export default class CheckDingtalk extends Vue {
  @UserModule.State("loginedUserInfo") loginedUserInfo!: any;
  @PropSync("info") syncInfo!: any;
  @PropSync("orgList") syncOrgList!: any;
  layout = {
    left: 5,
    right: 10,
  };
  showAddDepart: boolean = false;
  // 关闭新增关联组织弹窗
  closeAddDepart() {
    this.showAddDepart = false;
    this.$emit("getOrgList");
  }
  corpId: string = "";

  edit: boolean = false;

  params = {
    appSecret: "",
    appkey: "",
    corpId: "",
    corpSecret: "",
    exportHost: "",
    modifiedTime: "",
    name: "",
    orgType: 1,
    orgTypeStr: "",
    parentId: "",
    redirectUri: "",
    relatedType: "0",
    relatedTypeStr: "",
    scanAppId: "",
    scanAppSecret: "",
    syncType: 0,
    syncTypeStr: "",
    ssoSecret: "",
    agentId: "", // 消息推送ID
    pcServerUrl: env.portalHost, // pc端首页地址
    mobileServerUrl: "", // 移动端应用首页地址
    synRedirectUri: env.apiHost, // 增量同步回调地址
  };
  get isJustAdmin() {
    return this.$store.state.System.User.isJustAdmin;
  }
  // 处理第一次读不到值得问题
  get syncParams() {
    if (typeof this.syncInfo !== "number" || this.syncOrgList.length === 0) {
      return this.params;
    }
    console.log(this.syncOrgList);
    return this.syncOrgList[this.syncInfo];
  }
  get isSuperAdmin() {
    return (
      this.loginedUserInfo.username === "admin" ||
      this.loginedUserInfo.username === "Admin"
    );
  }

  get isNotShowRU() {
    return !(
      this.syncParams.orgType === "RELEVANCE" &&
      this.syncParams.syncType === "PUSH"
    );
  }
  // 查看appSecret
  showSecret(success: Function) {
    const vm = this;
    if (this.isJustAdmin) {
      this.$confirm({
        title:
          "该信息属于企业高保密信息，相当于个人银行卡及密码，请勿随意传播，请避免企业信息泄露。",
        okText: this.$t("languages.Apps.Continue").toString(),
        cancelText: this.$t("languages.Apps.Cancel").toString(),
        onOk() {
          success();
        },
      });
    } else {
      this.$warning({
        title: "该信息属于企业保密项，如有需要，请联系超级管理员。",
        okText: this.$t("languages.Apps.Good").toString(),
      });
    }
  }

  mounted() {
    if (this.syncInfo) {
      this.params = { ...this.params, ...this.syncInfo };
    }
  }
}
</script>

<style lang="less" scoped>
.organizetion-relate {
  text-align: left;
  margin-left: 6px;
  &__header {
    padding-bottom: 20px;
    position: relative;
    color: rgba(0, 0, 0, 0.85);
    font-weight: 600;
    span {
      line-height: 26px;
      height: 26px;
    }
    .header__tips {
      display: inline-block;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
      padding-left: 8px;
    }
  }
  &__form {
    .form__title {
      color: rgba(0, 0, 0, 0.85);
      font-weight: 500;
      margin: 20px 0;
    }
    .organizetion-relate__item {
      margin-bottom: 20px;
      div {
        float: left;
      }
      .organizetion-relate__left {
        span {
          color: rgba(0, 0, 0, 0.65);
        }
        position: relative;
        .required {
          left: -6px;
          color: #f5222d;
          position: absolute;
        }
        line-height: 32px;
      }

      .organizetion-relate {
        color: rgba(0, 0, 0, 0.85);
        &--edit {
          line-height: 32px;
        }
        .example {
          font-size: 12px;
          font-weight: 400;
          color: rgba(0, 0, 0, 0.45);
          line-height: 22px;
        }
      }
    }
  }
}
</style>

<style lang="less">
.edit-relative-org-drawer {
  .ant-drawer-wrapper-body {
    height: calc(100% - 57px) !important;
  }

  .ant-drawer-body {
    height: auto !important;
  }
}
</style>
