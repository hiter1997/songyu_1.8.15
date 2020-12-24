<template>
  <a-form class="add-organization">
    <a-row class="item-wrap">
      <a-col :span="6" class="item-title">上级部门</a-col>
      <a-col :span="18">
        <staff-selector
          :options="deptOpts"
          v-model="parent"
          :params="{ filterType: 'main' }"
          @change="onChange"
        ></staff-selector>
      </a-col>
    </a-row>

    <a-row class="item-wrap">
      <a-col :span="6" class="item-title">
        <span class="red">*</span>组织名称
      </a-col>
      <a-col :span="18">
        <a-input ref="orgNameInput" placeholder="组织名称" v-model="formInfo.name" />
      </a-col>
    </a-row>

    <a-row class="item-wrap">
      <a-col :span="6" class="item-title">组织维护方式</a-col>
      <a-col :span="18">
        <a-radio-group @change="syncChange" v-model="syncType" :disabled="!!info">
          <a-radio :value="0">钉钉向云枢同步</a-radio>
          <a-radio :value="1">云枢自维护</a-radio>
          <a-radio :value="2">企业微信集成</a-radio>
        </a-radio-group>
      </a-col>
    </a-row>

    <a-divider />

    <h3 class="vice-title"><span v-show="syncType === 0 || syncType === 1">钉钉</span><span v-show="syncType === 2">企业微信</span>集成参数</h3>

    <a-row class="item-wrap">
      <a-col :span="6" class="item-title">
        <span v-show="isRequired" class="red">*</span> CorpId
      </a-col>
      <a-col :span="18">
        <a-input ref="corpId" placeholder="Corpid" v-model="formInfo.corpId" />
      </a-col>
    </a-row>
    <a-row class="item-wrap">
      <a-col :span="6" class="item-title">
        <span v-show="isRequired" class="red">*</span>
        <template v-if="syncType === 2">Provider_Secret</template> 
        <template v-else>SSOSecret</template>
      </a-col>
      <a-col :span="18">
        <a-input ref="corpSecret" :placeholder="syncType === 2 ? 'Provider_Secret' : 'SSOSecret'" v-model="formInfo.corpSecret" />
      </a-col>
    </a-row>
    <a-row class="item-wrap">
      <a-col :span="6" class="item-title">
        <span v-show="isRequired" class="red">*</span> Agentld
      </a-col>
      <a-col :span="18">
        <a-input ref="agentId" placeholder="Agentld" v-model="formInfo.agentId" />
      </a-col>
    </a-row>
    <a-row class="item-wrap" v-if="syncType !== 2">
      <a-col :span="6" class="item-title">
        <span v-show="isRequired" class="red">*</span> AppKey
      </a-col>
      <a-col :span="18">
        <a-input ref="appkey" placeholder="AppKey" v-model="formInfo.appkey" />
      </a-col>
    </a-row>
    <a-row class="item-wrap">
      <a-col :span="6" class="item-title">
        <span v-show="isRequired" class="red">*</span> AppSecret 
      </a-col>
      <a-col :span="18">
        <a-input ref="appSecret" placeholder="AppSecret" v-model="formInfo.appSecret" />
      </a-col>
    </a-row>
    <a-row class="item-wrap" v-if="syncType !== 2">
      <a-col :span="6" class="item-title">
        <span v-show="isRequired" class="red">*</span> 扫码登录 appID
      </a-col>
      <a-col :span="18">
        <a-input ref="scanAppId" placeholder="扫码登录 appID" v-model="formInfo.scanAppId" />
      </a-col>
    </a-row>
    <a-row class="item-wrap" v-if="syncType !== 2">
      <a-col :span="6" class="item-title">
        <span v-show="isRequired" class="red">*</span> 扫码登录 appSecret
      </a-col>
      <a-col :span="18">
        <a-input ref="scanAppSecret" placeholder="扫码登录 appSecret" v-model="formInfo.scanAppSecret" />
      </a-col>
    </a-row>

    <a-row class="item-wrap" v-if="syncType !== 1">
      <a-col :span="6" class="item-title">
        <span v-show="isRequired" class="red">*</span> 增量回调地址
      </a-col>
      <a-col :span="18">
        <a-input ref="redirectUri" placeholder="增量回调地址" v-model="formInfo.redirectUri" />
      </a-col>
    </a-row>
    <a-row class="item-wrap" v-if="syncType !== 2">
      <a-col :span="6" class="item-title">
        <span v-show="isRequired" class="red">*</span> PC端首页登录地址
      </a-col>
      <a-col :span="18">
        <a-input ref="pcServerUrl" placeholder="PC端首页登录地址" v-model="formInfo.pcServerUrl" />
      </a-col>
    </a-row>

    <div class="btn-wrap">
      <a-button @click="connect">链接测试</a-button>
      <a-button type="primary" @click="confirm">确定</a-button>
    </div>
  </a-form>
</template>

<script lang="ts">
import {
  Component,
  Vue,
  Prop,
  Watch,
  Emit,
  PropSync,
} from "vue-property-decorator";
import { State, namespace } from "vuex-class";
import StaffSelector from "@cloudpivot/form/src/common/components/form-staff-selector/pc/staff-selector.vue";
import OrgApi from "@/apis/organization";
import systemApi from "@/apis/system/system-manager.api";
import env from "@/env.ts";
import CheckDingtalk from "./check-dingtalk.vue";

const UserModule = namespace("System/User");

@Component({
  name: "add-organization",
  components: {
    StaffSelector,
  },
})
export default class Error extends Vue {
  @Prop({ default: 0 }) info!: any;
  @UserModule.State("loginedUserInfo") loginedUserInfo!: any;
  // @Prop() showAddDepart!:any = false;
  parentDepart: Array<any> = [];

  value: any = 1;
  syncType: number = 0;
  formInfo: any = {
    agentId: "",
    appSecret: "",
    appkey: "",
    corpId: "",
    corpSecret: "",
    exportHost: "",
    mobileServerUrl: "",
    modifiedTime: "",
    name: "",
    orgType: "1",
    orgTypeStr: "",
    parentId: "",
    redirectUri: "", // 回调域名
    relatedType: "0",
    relatedTypeStr: "",
    scanAppId: "",
    scanAppSecret: "",
    syncType: 0,
    syncTypeStr: "",
    ssoSecret: "",
    pcServerUrl: env.portalHost,
    adminServerUrl: "",
    ssoServerUrl: "",
  };
  parent: any = null;
  deptOpts: any = {
    selectOrg: true,
    selectUser: false,
    showModel: false,
    mulpitle: false,
    showSelect: true,
    placeholder: "请选择部门",
    appManagerFilter: true,
    isInit: false,
    rootNode: [],
    selected: [],
  };

  get isRequired() {
    return this.syncType === 0 || this.syncType === 2;
  }
  
  @Watch('syncType')
  onSyncTypeChange(v) {
    this.formInfo.syncType = v === 1 ? 'PUSH' : 'PULL';
    
    // 微信的组织类型是1，钉钉的组织类型是0
    if (v === 2) {
      this.formInfo.relatedType = 'WECHAT'
    } else if(v === 0) {
      this.formInfo.relatedType = 'DINGTALK'
    } else if(v === 1) {
      // 自维护暂时写死DINGTALK
      this.formInfo.relatedType = 'DINGTALK'
    } else {
      this.formInfo.relatedType = 'OTHER'
    }
  }

  @PropSync("showAddDepart") syncShowAddDEpart!: any;
  @PropSync("orgList") syncOrgList!: any;
  @Emit()
  cancel() { }
  created() {
    
    // 如果是编辑的话需要更新数据
    if (this.info) {
      
      if (this.info.syncType === 'PUSH') {
        this.syncType = 1;
      } else {
        if (this.info.relatedType === 'WECHAT') {
          this.syncType = 2;
        } else if (this.info.relatedType === 'DINGTALK') {
          this.syncType = 0;
        }
      }

      // if (this.info.relatedType === 'WECHAT') {
      //   this.syncType = 2;
      // } else if (this.info.relatedType === 'DINGTALK') {
      //   this.syncType = 0;
      // } else {
      //   this.syncType = 1;
      // }

      this.formInfo = { ...this.formInfo, ...this.info };
      this.formInfo.syncType = this.formInfo.syncType === "PUSH" ? 1 : 0;
      this.parent = this.info.parentDept;
      this.deptOpts.isInit = true;
      if (this.parent) {
        this.deptOpts.selected = [this.parent];
      }
    }
    // 无部门
    if (!this.formInfo.parentId) {
      this.formInfo.parentId = "none";
    }
  }
  mounted() {
    // this.getPortalSetting();
  }
  // 父级组织id
  onChange(depart: any) {
    if (depart.length > 0) {
      this.formInfo.parentDept = depart[0];
      this.formInfo.parentId = depart[0].id;
    } else {
      this.formInfo.parentDept = null;
      this.formInfo.parentId = "none";
    }
  }
  /**
   * @desc 组织同步切换
   */
  syncChange(...args) {
    // console.log('...arges', args)
  }

  // 参数错误提示
  errMpas() {

    // 钉钉集成参数错误提示
    const dingTalkErrMpas: any = {
      corpId: "请输入CorpId",
      corpSecret: "请输入SSOSecret",
      agentId: "请输入AgentId",
      appkey: "请输入Appkey",
      appSecret: "请输入AppSecret",
      scanAppId: "请输入扫码登录AppID",
      scanAppSecret: "请输入扫码登录AppSecret",
      redirectUri: "请输入增量回调地址",
      pcServerUrl: "请输入PC端首页登录地址",
    };

    const wechatErrMpas: any = {
      corpId: "请输入CorpId",
      agentId: "请输入AgentId",
      corpSecret: "请输入Provider_Secret",
      appSecret: "请输入AppSecret",
      redirectUri: "请输入增量回调地址",
    };

  return this.syncType === 2 ? wechatErrMpas : dingTalkErrMpas;
  }
  /**
   * 检验钉钉集成参数必填
   * */
  checkDingtalkParams(): boolean {
    const { isRequired, formInfo, errMpas } = this;

    // 如果是非必填，不做校验
    if (!isRequired) return true;

    const errArr = errMpas();

    const needCheckKeys: string[] = Object.keys(errArr) as string[];

    const allkeys: Array<string> = Object.keys(formInfo) as Array<string>;

    let isOk: boolean = true;
    for (let i = 0; i < needCheckKeys.length; i++) {
      const k: string = needCheckKeys[i] as string;
      if (!formInfo[k]) {
        isOk = false;
        this.$message.error(errArr[k]);
        (this.$refs[k] as any).focus();
        break;
      } else {
        isOk = true;
      }
    }

    return isOk;
  }

  // 确认提交或者保存
  confirm() {
    let params = this.formInfo;
    let { parentId, name, syncType } = params;
    delete params.parentDept;
    // if (!parentId) {
    //   return this.$message.error('请选择上级部门')
    // }
    if (!name && syncType === 0) {
      this.$message.error("请输入组织名称");
      (this.$refs.orgNameInput as any).focus();
      return;
    }

    if (!this.checkDingtalkParams()) {
      return;
    }

    // 处理父组织为空
    if (parentId === "none") {
      params.parentId = "";
    }

    // 重置数据 去除前后空格，  接口参数 和 表单数据
    Object.keys(this.formInfo).forEach((key: string) => {
      if (typeof this.formInfo[key] === "string") {
        this.formInfo[key] = this.formInfo[key].trim();
        params[key] = params[key].trim();
      }
    });

    // 如果是编辑
    if (this.info) {
      return this.update(params);
    }
    this.save(params);
    // this.cancel()
  }
  // 新增保存
  async save(params: any) {
    // 如果没有关联组织，第一个添加的为主组织
    if (this.syncOrgList.length === 0) {
      params.orgType = 0;
    }
    // params.pcServerUrl = env.portalHost; // pc端首页地址
    params.mobileServerUrl = `${params.pcServerUrl}/mobile`; // 移动端应用首页地址
    // params.synRedirectUri = env.apiHost; // 增量同步回调地址
    params.synRedirectUri = params.redirectUri; // 增量同步回调地址

    // @ts-ignore
    let { errcode, errmsg, data } = await OrgApi.addOrgan(params);
    if (errcode !== 0) {
      this.$message.error(errmsg);
    } else {
      this.$message.success(errmsg);
      this.$emit("close");
    }
  }
  // 编辑保存
  async update(params: any) {
    params.mobileServerUrl = `${params.pcServerUrl}/mobile`; // 移动端应用首页地址
    params.synRedirectUri = params.redirectUri; // 增量同步回调地址
    // @ts-ignore
    let { errcode, errmsg, data } = await OrgApi.updateOrgan(params);
    if (errcode !== 0) {
      this.$message.error(errmsg);
    } else {
      this.$message.success(errmsg);
      this.$emit("close");
    }
  }
  /**
   * @desc 获取父级部门
   */
  async getDepart(deptIds: string) {
    // @ts-ignore
    let res: any = await OrgApi.getOrgDepartmentInfo({
      deptIds,
    });

    if (res.errcode !== 0) {
      this.$message.error(res.errmsg);
    } else {
      this.parent = res.data.myDepartment[0];
    }
  }
  getPortalSetting() {
    const vm: any = this;
    systemApi.getPortalSetting().then((res: any) => {
      if (res.data) {
        vm.formInfo = { ...vm.formInfo, ...res.data };
      }
    });
  }
  // 连接测试
  connect() {
    const vm: any = this;
    vm.formInfo.mobileServerUrl = `${vm.formInfo.pcServerUrl}/mobile`;
    /* 设置传参 */
    const { oauthHost, redirectHost } = env;
    vm.formInfo.adminServerUrl = redirectHost;
    vm.formInfo.ssoServerUrl = oauthHost + "/login";
    // vm.formInfo.redirectUri = oauthHost + "/login";
    vm.formInfo.synRedirectUri = vm.formInfo.redirectUri;

    systemApi.checkPortalSetting(vm.formInfo).then((res: any) => {
      if (res.errcode === 0) {
        vm.$message.success("连接成功！", 2);
      } else {
        vm.$message.error(res.errmsg, 2);
      }
    });
  }
}
</script>

<style lang="less">
.add-organization {
  .item-wrap {
    display: flex;
    align-items: center;
    height: 50px;
  }
  .item-title {
    text-align: left;
    padding-right: 16px;
  }
  .red {
    color: red;
  }
  .btn-wrap {
    display: flex;
    justify-content: center;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 12px;
    border-top: 1px solid #d9d9d9;
    background: white;
    button {
      margin: 0 6px;
    }
  }
  .vice-title {
    font-size: 14px;
    line-height: 1;
    margin: 24px 0;
    font-weight: bold;
  }
}
</style>
