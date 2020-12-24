<template>
  <div class="common-setting">
    <div class="common-setting__header">
      <span class="common-setting-span" v-if="orgList.length === 1">常规设置</span>
      <div class="deparment-wrap" v-if="orgList.length > 1">
        <span
          class="department-branch"
          v-if="orgList.length > 0"
          :class="{'active': active === key}"
          v-for="(item, key) in orgList"
          :key="key"
          @click="changeActive(key)"
        >{{ (!item.name && item.orgType === 'MAIN') ? item.orgTypeStr : item.name }} {{ item.orgType === "MAIN"? '(主)' : '' }}</span>
      </div>

      <a-button
        v-if="organizationRelated && isJustAdmin"
        type="default"
        class="add-deparment"
        @click="() => this.showAddDepart = true"
      >
        <a-icon type="plus" />新增关联组织
      </a-button>
    </div>
    <div class="common-setting__content">
      <div class="set-support" v-if="orgList[active].orgType === 'MAIN'">
        <p>主组织维护方式</p>
        <a-select
          :defaultValue="isCloudPivot"
          style="width: 120px"
          class="set-support-select"
          :value="isCloudPivot"
          :disabled="!this.$store.state.System.User.isJustAdmin"
          @change="handleChange"
        >
          <a-select-option
            :value="item.value"
            :key="item.value"
            v-for="item in setList"
          >{{ item.label }}</a-select-option>
        </a-select>
        <span class="set-support-tip">提示：主组织启用以后不允许再修改主组织维护方式，否则将会导致数据、权限错乱</span>
      </div>

      <template v-if="active === 0">
        <!-- 主组织钉钉（企业微信）维护 主组织 -->
        <template v-if="isCloudPivot === 0">
          <!-- 钉钉集成维护 -->
          <a-steps direction="vertical" :current="-1" class="common-setting__step">
            <a-step id="app-list1">
              <div class="common-setting__dingtalk" slot="description">
                <check-dingtalk :info="orgList[active]" @close="closeAddDepart" :edit="edit">
                  <span @click="ShowConfigRule" slot="settingTips">
                    <a href="javascript:void(0)">配置规则</a>
                  </span>
                </check-dingtalk>
              </div>
            </a-step>
            <!--     <a-step id="app-list4">
              <div class="common-setting__dingtalk" slot="description">
                <syn-redirect-url>
                  <span @click="ShowConfigRule" slot="settingTips"><a href="javascript:void(0)"> 配置规则 </a></span>
                </syn-redirect-url>
              </div>
            </a-step>-->
            <a-step id="app-list2">
              <div class="common-setting__dingtalk" slot="description">
                <portal-setting
                  :info="orgList[active]"
                  @close="closeAddDepart"
                  :edit="edit"
                  :cloudPivot="isCloudPivot"
                  @changeEdit="changeEdit"
                >
                  <span @click="ShowConfigRule" slot="settingTips">
                    <a href="javascript:void(0)">配置规则</a>
                  </span>
                </portal-setting>
              </div>
            </a-step>
            
          </a-steps>
        </template>

        <template v-else-if="isCloudPivot === 2">
          <!-- 企业微信集成维护 -->
          <a-steps direction="vertical" :current="-1" class="common-setting__step">
            <a-step id="app-list1">
              <div class="common-setting__dingtalk" slot="description">
                <wechat-setting
                  :info="orgList[active]"
                  @close="closeAddDepart"
                  :edit="edit"
                  :cloudPivot="isCloudPivot"
                  @changeEdit="changeEdit"
                >
                  <span @click="ShowConfigRule" slot="settingTips">
                    <a href="javascript:void(0)">配置规则</a>
                  </span>
                </wechat-setting>
              </div>
            </a-step>
            
          </a-steps>
        </template>

        <template v-else>
          <!-- 云枢自维护 -->
          <a-steps
            direction="vertical"
            :current="-1"
            class="common-setting__step"
            v-if="active === 0"
          >
            <a-step id="app-list1">
              <div class="common-setting__dingtalk" slot="description">
                <div class="set-corp-name">
                  <a-row class="corp-name">
                    <a-col :span="5">
                      <span class="required">*</span>
                      <span>企业名称</span>
                    </a-col>
                    <a-col :span="10">
                      <a-input v-model="cropName" />
                    </a-col>
                  </a-row>

                  <a-row v-if="this.$store.state.System.User.isJustAdmin">
                    <a-col :span="5"></a-col>
                    <a-col :span="10">
                      <a-button type="primary" @click="setCropName">保存</a-button>
                    </a-col>
                  </a-row>
                </div>
              </div>
            </a-step>
            
          </a-steps>
        </template>
        
      </template>

      <template v-else>
        <!-- 关联组织 -->
        <organizetion-relate :info="active" @getOrgList="getOrgList" :orgList="orgList">
            <span @click="ShowConfigRule" slot="settingTips">
              <a
                href="javascript:void(0)"
                style="display: inline-block;font-size: 12px;color: #17BC94; padding-left: 8px;"
              >配置规则</a>
            </span>
          </organizetion-relate>
      </template>

      <!-- <div class="common-setting__border"></div> -->
      <!-- <div class="common-setting__storage" id="app-list4" v-if="active === 0">
        <file-storage/>
      </div>-->
      <!-- <div class="common-setting__dingtalk">
        <check-dingtalk/>
      </div>
      <div class="common-setting__border"></div>
      <div class="common-setting__portal">
        <portal-setting/>
      </div>
      <div class="common-setting__border"></div>
      <div class="common-setting__storage">
        <file-storage/>
      </div>-->
    </div>

    <a-modal
      :visible="showGuide"
      width="418px"
      :centered="true"
      class="common-setting__guide"
      :okText="'下一步'"
      @ok="doGuide"
      :maskClosable="false"
      :keyboard="false"
    >
      <div class="guide__wrap clearfix">
        <div class="guide__wrap--img">
          <img src="@/assets/images/welcomeBpm.png" />
        </div>
        <p class="guide__wrap--tips">Hi，欢迎进入云枢系统， 为了您在使用过程中得到更好的体验， 请先跟着我配置信息。</p>
        <!-- <div class="guide__wrap--tips">

        </div>-->
      </div>
    </a-modal>

    <a-drawer title="配置规则" :width="660" :visible="showDrawer" @close="ShowConfigRule">
      <config-rule />
    </a-drawer>
    <a-drawer
      title="新增关联组织"
      :visible="showAddDepart"
      :destroyOnClose="true"
      @ok="closeAddDepart"
      @close="closeAddDepart"
      :width="860"
      wrapClassName="add-o-drawer"
    >
      <add-organization @close="closeAddDepart" :info="null" :orgList="orgList" />
    </a-drawer>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { State, namespace } from "vuex-class";
import h3Intro from "@/utils/introjs/h3-intro";
import CheckDingtalk from "./check-dingtalk.vue";
import PortalSetting from "./portal-setting.vue";
import WechatSetting from "./wechat-setting.vue";
import AddOrganization from "./add-organization.vue";
import SynRedirectUrl from "./syn-redirect-url.vue";
import ConfigRule from "./config-rule/index.vue";
import OrganizetionRelate from "./organizetion-relate.vue";
import OrgApi from "@/apis/organization";
import systemApi from "@/apis/system/system-manager.api";
import Oauth from "@/apis/oauth";
import env from "@/env.ts";

@Component({
  name: "common-setting",
  components: {
    CheckDingtalk,
    PortalSetting,
    WechatSetting,
    SynRedirectUrl,
    ConfigRule,
    AddOrganization,
    OrganizetionRelate
  }
})
export default class CommonSetting extends Vue {
  showGuide: boolean = false;

  showDrawer: boolean = false;

  cropName: string = "";
  isCloudPivot: any = 0;
  //  get isCloudPivot() { // 是否已打开内部维护组织开关
  //     return this.$store.state.config.cloudPivot || 0;
  //   }
  setVal: any = 0;
  isUpdate: boolean = false;
  showAddDepart: boolean = false;
  main: any = null;
  edit: boolean = false;
  setList: Array<any> = [
    {
      label: "钉钉集成维护",
      value: 0
    },
    {
      label: "云枢自主维护",
      value: 1
    },
    {
      label: "企业微信集成维护",
      value: 2
    }
  ];
  active: number = 0;
  orgList: Array<any> = [
    {
      orgType: "MAIN",
      name: ""
    }
  ];

  get organizationRelated() {
    return this.$store.state.config.organizationRelated && !!this.main;
  }
  get isJustAdmin() {
    return this.$store.state.System.User.isJustAdmin;
  }
  /**
   * @desc 切换主组织维护放肆
   */
  handleChange(cloudPivotType) {
    // console.log('cloudPivotType', cloudPivotType)
    // this.isCloudPivot = cloudPivotType;
    if (this.isUpdate) return false;
    this.isUpdate = true;
    // @ts-ignore
    systemApi.setCloudProvt({ cloudPivotType }).then(res => {
      let { errcode, errmsg } = res;
      this.isUpdate = false;
      if (errcode === 0) {
        this.isCloudPivot = cloudPivotType;
        Oauth.getSystemConfig().then(config => {
          if (config) {
            this.$store.commit("setConfig", config);
          }
        });
      } else {
        this.$message.error(errmsg);
      }
    });
  }
  /**
   * @desc 切换子组件编辑状态
   */
  changeEdit(edit: boolean) {
    this.edit = edit;
  }
  /*
   * 设置企业名称
   */
  async setCropName() {
    if (!this.cropName) {
      this.$message.warning("请填写企业名称！");
      return;
    }
    /* 设置传参 */
    const { oauthHost, redirectHost } = env;
    let params: any = {
      agentId: "",
      appSecret: "",
      appkey: "",
      corpId: "",
      corpSecret: "",
      exportHost: "",
      mobileServerUrl: "",
      modifiedTime: "",
      orgType: 0,
      orgTypeStr: "",
      parentId: "",
      relatedType: 3,
      relatedTypeStr: "",
      scanAppId: "",
      scanAppSecret: "",
      syncType: 0,
      syncTypeStr: "",
      ssoSecret: ""
    };
    if (this.main) {
      params = { ...params, ...this.main };
    }
    params.redirectUri = oauthHost + "/login"; // 回调域名
    params.pcServerUrl = env.portalHost;
    params.adminServerUrl = redirectHost;
    params.relatedType = "OTHER";
    params.syncType = "PUSH";
    params.ssoServerUrl = oauthHost + "/login";
    params.synRedirectUri = env.apiHost;
    params.name = this.cropName;
    // @ts-ignore
    // let { errcode, errmsg, data } = await OrgApi.addOrgan(params);
    // if (errcode !== 0) {
    //   this.$message.error(errmsg)
    // } else {
    //   this.$message.success(errmsg);
    // }
    if (this.main) {
      this.update(params);
    } else {
      this.save(params);
    }
    // OrgApi.setCropName(params).then((res:any) =>  {
    //   if (res.errcode) {
    //     this.$message.error(res.errmsg);
    //     return;
    //   }
    //   this.$message.success('保存成功！');
    // });
  }
  // 新增保存
  async save(params) {
    // @ts-ignore
    let { errcode, errmsg, data } = await OrgApi.addOrgan(params);
    if (errcode === 0) {
      this.$message.success(errmsg);
    } else {
      this.$message.error(errmsg);
    }
  }
  // 编辑保存
  async update(params) {
    // @ts-ignore
    let { errcode, errmsg } = await OrgApi.updateOrgan(params);
    if (errcode === 0) {
      this.$message.success(errmsg);
    } else {
      this.$message.error(errmsg);
    }
  }

  /**
   * 抽屉显隐的控制
   */
  ShowConfigRule() {
    this.showDrawer = !this.showDrawer;
  }
  // 关闭新增关联组织弹窗
  closeAddDepart() {
    this.showAddDepart = false;
    // 更新数据
    this.getOrgList();
  }
  /**
   * 指引开始
   */
  doGuide() {
    (window as any).h3Intro.start();
    this.showGuide = false;
  }
  getCloudPivot() {
    if ("isCloudPivot" in this.$store.state.config) {
      this.isCloudPivot = this.$store.state.config.isCloudPivot;
      // 获取企业名称
      // @ts-ignore
      //  OrgApi.getCropName().then((res:any) =>  {
      //   if (!res.errcode && res.data) {
      //     this.cropName = res.data.deptName;
      //   }
      // });
    } else {
      setTimeout(() => this.getCloudPivot(), 100);
    }
    // 设置引导提示信息
    this.showGuide = true;
    const isShowGuide = localStorage.getItem("isNewUser");
    if (!isShowGuide) {
      this.showGuide = true;
      localStorage.setItem("isNewUser", "toDoGuide");
    } else {
      this.showGuide = false;
    }

    let stepData: any = [];
    if (this.isCloudPivot === 0) {
      stepData = [
        {
          element: "#app-list1",
          content:
            "钉钉集成：系统基于钉钉内置使用，系统中组织机构从钉钉同步，需在钉钉中自建应用，\
          并获取应用消息填写在下方，详细配置步骤请查看“配置规则”"
        },
        /* {
          element: '#app-list2',
          content: '增量同步：钉钉中组织修改变更，增量同步到系统中，\
            配置信息保存即可绑定钉钉同步，详细配置步骤请查看“配置规则”'
        },  */
        {
          element: "#app-list2",
          content:
            "门户访问设置：用户在门户钉钉扫码登录配置，\
          需配置相关信息，详细配置步骤请查看“配置规则”"
          // position: 'right',
        }
      ];
    } else if (this.isCloudPivot === 1) {
      stepData = [
        {
          element: "#app-list1",
          content: "企业名称：系统内本企业的名称，将作为组织机构根节点显示"
        }
      ];
    } else if (this.isCloudPivot === 2) {
      stepData = [
        {
          element: "#app-list1",
          content: "正确配置企业微信集成参数"
        }
      ];
    }

    (window as any).h3Intro = h3Intro({
      stepData
    });
  }

  /**
   * 生命周期
   */
  mounted() {
    // 更新组织维护配置开关设置参数
    this.getCloudPivot();
    this.getOrgList();
  }
  // 获取组织机构列表
  async getOrgList() {
    // @ts-ignore
    let { errcode, errmsg, data } = await OrgApi.getOrgaList();
    if (errcode !== 0) {
      return this.$message.error(errmsg);
    }
    // @ts-ignore
    if (data.length) {
      // @ts-ignore
      let main = data.find((item: any) => item.orgType === "MAIN");
      this.main = main;
      // 自维护初始化企业名称
      this.cropName = main.name;

      // @ts-ignore
      let others = data.filter((item: any) => item.orgType !== "MAIN");
      this.orgList = [main, ...others];
    }
  }
  // 切换显示
  changeActive(key: number): void {
    this.active = key;
  }
}
</script>
<style lang="less" scoped>
.common-setting {
  margin: 0 24px;
  height: 100%;
  &__content {
    .common-setting__step {
      max-width: 700px;
    }
    /deep/.ant-steps-item-description {
      padding-bottom: 24px;
    }
    height: calc(100% - 70px);
    overflow-y: auto;
    padding-left: 10px;
    padding-top: 24px;
    padding-bottom: 64px;
    // position: relative;
  }
  &__header {
    text-align: left;
    border-bottom: 1px solid rgba(232, 232, 232, 1);
    height: 48px;
    display: flex;
    align-items: center;
    line-height: 48px;
    display: flex;
    justify-content: space-between;
    .common-setting-span {
      margin-right: 20px;
    }
    .setting-title {
      font-weight: 500;
      font-size: 16px;
      line-height: 22px;
    }
    .deparment-wrap {
      white-space: nowrap;
      word-break: normal;
      overflow: auto;
      display: inline-block;
      max-width: 80%;
      margin-right: 20px;
      margin-left: 20px;
      box-sizing: border-box;
    }
    .department-branch {
      color: #333;
      display: inline-block;
      height: 48px;
      padding: 0 16px;
      cursor: pointer;
      position: relative;
      &.active {
        color: #17bc94;
        &:after {
          content: "";
          display: block;
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 2px;
          background: #17bc94;
        }
      }
    }
  }
  &__border {
    border-bottom: 1px solid rgba(232, 232, 232, 1);
    // min-height: 1px;
  }
  &__dingtalk {
    max-width: 700px;
    margin-top: 2px;
    // margin-top: 300px;
    .set-corp-name {
      position: relative;
      padding-left: 5px;
      .required {
        left: -6px;
        color: #f5222d;
        position: absolute;
      }
      .corp-name {
        margin-bottom: 20px;
      }
    }
  }
  &__storage {
    max-width: 740px;
    margin-top: 24px;
  }
  &__portal {
    max-width: 700px;
    margin-top: 24px;
  }
  /deep/&__guide {
    /deep/.ant-modal-close {
      display: none;
    }
  }
  .set-support {
    & {
      display: flex;
      font-size: 14px;
      margin-bottom: 20px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: rgba(0, 0, 0, 0.65);
      line-height: 32px;
    }
    .set-support-tip {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }
    .set-support-select {
      margin: 0 16px;
      width: 130px !important;
    }
  }
}
</style>
<style lang="less">
@import "~@/utils/introjs/h3-intro.less";
.common-setting__guide {
  .guide__wrap {
    .guide__wrap--img {
      float: left;
      img {
        width: 82px;
        height: 93px;
      }
    }
    .guide__wrap--tips {
      // float: left;
      margin-left: 108px;
      padding-top: 7px;
      font-size: 16px;
    }
  }
  // 隐藏进入云枢系统引导modal框取消按钮
  .ant-modal-content {
    .ant-modal-footer {
      .ant-btn:nth-child(1) {
        display: none;
      }
    }
  }
  .ant-modal-close {
    display: none;
  }
  .ant-modal-footer {
    border-top: 0;
  }
  .ant-btn-default {
    display: none;
  }
  .ant-modal-body {
    padding-bottom: 0;
  }
}

.add-o-drawer {
  .ant-drawer-wrapper-body {
    overflow: hidden;
  }
  .ant-drawer-body {
    height: calc(100% - 115px);
    overflow: auto;
  }
}

.add-deparment {
  margin-right: 24px;
}
</style>
