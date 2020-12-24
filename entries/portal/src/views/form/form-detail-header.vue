
<template>
  <div class="header">
    <div>
      <div class="header-left">
        <a
          v-if="isDingTalk"
          class="aback"
          @click="back">返回</a>
        <img
          class="logo"
          :src="logo"
          @click="goHome" />

        <a
          v-if="isDingTalk"
          class="open-blank"
          @click="openBlank">在浏览器中打开</a>
        <div class="header-dropdown" v-if="nodes.length > 0">
          <a-dropdown :trigger="['click']">
            <div><span>{{ activeNodes }}</span>   <a-icon type="down" /></div>
            <!-- <a class="ant-dropdown-link" href="#">  <a-icon type="down" /> </a> -->
            <a-menu slot="overlay">
              <a-menu-item
                v-for="(node, index) in nodes"
                :key="node.activityCode"
                :class="{'a-menu-item-active': node.selected}"
                class="node-switch-menu-item"
              >
                <a href="javascript:;" @click="nodesSwitch(index)">{{ node.activityName }}</a>
              </a-menu-item>
              <!-- <a-menu-item>
                <a href="javascript:;">2nd menu item</a>
              </a-menu-item>
              <a-menu-item>
                <a href="javascript:;">3rd menu item</a>
              </a-menu-item> -->
            </a-menu>
          </a-dropdown>
        </div>
      </div>



      <div
        @mouseover="showBigQrcode = true"
        @mouseout="showBigQrcode = false"
        @click.stop="showBigQrcode = true"
        v-if="!isEL&&showQrcode"
        class="qrcode"
      >
        <!--<img  @click.stop="showBigQrcode = !showBigQrcode" src="~@/assets/images/qrcode-icon.png"/>-->
        <img src="~@/assets/images/qrcode-icon.png" />
        <div class="qrcode-enlarge" v-show="showBigQrcode">
          <img :src="url" />
          <p v-if="isAdd">钉钉扫码查看数据</p>
          <p v-else>钉钉扫码填写数据</p>
        </div>
      </div>
    </div>

    <slot></slot>
    <!-- ygc---start--- 费用报销、付款申请自定义打印 -->
    <a-button v-if="this.isExpense" @click="printExpense()">打印</a-button>
    <expense-print
      :expenseData="expenseData"
      :workFlowInfos="workFlowInfos"
      :workflowInstanceId="workFlowInfos.workflowInstanceId"
      ref="expenseChild"
      v-if="this.isExpense"
      v-show="false"
    />
    <a-button v-if="this.isPayment" @click="printPayment()">打印</a-button>
    <payment-print
      :paymentData="paymentData"
      :workFlowInfos="workFlowInfos"
      :workflowInstanceId="workFlowInfos.workflowInstanceId"
      ref="paymentChild"
      v-if="this.isPayment"
      v-show="false"
    />
    <!-- ygc---end--- 费用报销、付款申请自定义打印 -->
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";

import { Button, Dropdown, Menu, Icon } from "@h3/antd-vue";

import { Getter } from "vuex-class";
import site from "@/config/site";

import env from "@/config/env";

import { externalLinkApi } from "@cloudpivot/api";
/* ygc---费用报销付款申请自定义打印 */
import * as platform from "@cloudpivot/platform";

import OAuthApi from '@/apis/oauth';

/* ygc---费用报销付款申请自定义打印 */
import expensePrint from "../../../extends/songyuprint/expense-print.vue";
import paymentPrint from "../../../extends/songyuprint/payment-print.vue";
@Component({
  name: "form-detail-header",
  components: {
    AButton: Button,
    ADropdown: Dropdown,
    AMenu: Menu,
    AMenuItem: Menu.Item,
    AIcon: Icon,
    // ygc自定义打印
    expensePrint, //费用报销打印
    paymentPrint, //付款申请打印
  }
})
export default class FormDetailHeader extends Vue {
  @Getter("getAntLocale") locale!: string;

  @Prop() formObj!: any;

  @Prop() nodes!: any;

  showBigQrcode = false;

  url = "";

    /* ygc---start---费用报销付款申请自定义打印 */
  isExpense: boolean = false;
  isPayment: boolean = false;
  allowPrint: boolean = true;
  expenseData: any = {};
  paymentData: any = {};
  orderId: string = " ";
  workFlowInfos: any = {};
  /* ygc---end---费用报销付款申请自定义打印 */
  get logo() {
    return site.logo;
  }

  async getUserInfo() {
    const res = await OAuthApi.getUserInfo();
    if (res.errcode === 0) {
      const info:any = res.data;
      sessionStorage.setItem('user', JSON.stringify(info));
      this.onFormObjChange(this.formObj);
    }
  }

  // 跳转到首页
  goHome() {
    const appCode = window.Environment ? window.Environment.appCode : null;
    if (appCode) {
      this.$router.push({
        name: 'singleApp',
        params: {
          appCode
        }
      }).catch((err: any) => {err})
    } else {
      this.$router.push({ name: "myUnfinishedWorkItem" }).catch((err: any) => {err});
    }
  }

  isAdd = false;

  back() {
    const url = this.$route.query.return as string;
    if (url) {
      this.$router.push({
          path: url
      }).catch((err: any) => {err});
    } else {
      this.$router.go(-1);
    }
    // const back = sessionStorage.getItem('backList');
    // if (back) {
    //   const url : any = sessionStorage.getItem('backListUrl');
    //   sessionStorage.removeItem('backList');
    //   this.$router.push(url);
    //   this.$router.go(-1);
    // } else {
    //   const url : any = sessionStorage.getItem('backListUrl');
    //   this.$router.go(-1);
    // }
  }

  openBlank() {
    const url = `${location.href}${
      location.href.indexOf("?") > -1 ? "&" : "?"
    }access_token=${localStorage.getItem("token")}`;

    window.open(url, "_blank");
  }

  // get url() {
  //   // const config:any = this.$store.state.config;
  //   // const corpId = config.corpId;
  //   // const agentId = config.agentId;

  //   // const locHref = window.location.pathname + window.location.search;

  //   // const signinUrl = '47.107.160.206' + "/mobile/?meetingId="+"&corpId=ding6a0a954b9b413bcf35c2f4657eb6378f&agentId=235111190&mode=create&schemaCode=meeting_signin&sheetCode=signin&num=" + new Date().getTime();
  //   // debugger

  //   return src;
  // }

  get isEL() {
    return (window as any).externalLinkToken;
  }

  get activeNodes() {
    const theNode = this.nodes.find(res => res.selected);
    if (theNode) {
      return theNode.activityName
    }
    return '';
  }

  nodesSwitch(index:number) {
    if (this.nodes[index].selected) return;
    let theNode = '';
    this.nodes.forEach((res,idx) => {
      if (idx === index) {
        res.selected = true;
        theNode = res.activityCode
      } else {
        res.selected = false;
      }
    });
    this.nodes = this.nodes.slice();

    this.$emit('nodesSwitch', theNode);
  }

  get showQrcode() {
    let user:any = sessionStorage.getItem('user');
    if (!user) {
      return
    }
    user = JSON.parse(user);

    const syncTypeIsCloudPivot =  user.relatedType === 'DINGTALK';
    // console.log(this.$store.state.config.isCloudPivot,'this.$store.state.config.cloudPivot');
    if(!syncTypeIsCloudPivot){ 
      return false;
    }
    if (!this.formObj.bizSheet) {
      return false;
    }
    // 表单二维码码默认开启
    if (
      this.formObj.bizSheet.qrCodeAble === "open" ||
      !this.formObj.bizSheet.qrCodeAble
    ) {
      return true;
    }
    return false;
  }

  created() {
    const user = sessionStorage.getItem('user');
    if (!user) {
      this.getUserInfo();
    }
  }

  mounted() {
    document.addEventListener("click", this.outFocus);
  }

  destoryed() {
    document.removeEventListener("click", this.outFocus);
  }
  outFocus() {
    this.showBigQrcode = false;
  }


  @Watch("formObj", {
    immediate: true
  })
  onFormObjChange(formObj: any) {
    if (!formObj.bizSheet) return;

    const { workflowInstanceId, workItemId, workflowCode } = formObj;

    /* ------------------------------------ygc--- 自定义操作start ------------------------------------ */
    const { id, schemaCode, sheetCode, loadedFromDb, data } = formObj.bizObject;
    this.orderId = id;
    if(schemaCode === "expense_eimbursemen" && loadedFromDb === true) {
      this.workFlowInfos = formObj;
      this.isExpense = true;
    }
    if(schemaCode === "approval_payment" && loadedFromDb === true) {
      this.workFlowInfos = formObj;
      this.isPayment = true;
    }
    /* ------------------------------------ygc--- 自定义操作end ------------------------------------ */

    if (!this.$store) {
      return;
    }
    let user:any = sessionStorage.getItem('user');
    if (!user) {
      return
    }
    user = JSON.parse(user);
    const config = {
      corpId: user.corpId,
      agentId: user.agentId,
      mobileServerUrl: user.mobileServerUrl
    }
    // const { config } = this.$store.state;

    // if (!config) {

    // }

    const { corpId } = config;

    const { agentId } = config;

    this.isAdd = loadedFromDb;

    let signinUrl = "";
    // 数据来自数据库 生成查看表单
    if (loadedFromDb) {
      // 流程表单
      if (workflowInstanceId && workItemId) {
        // 新增
        signinUrl = `${config.mobileServerUrl}/?workflowInstanceId=${workflowInstanceId}&workItemId=${workItemId}&corpId=${corpId}&agentId=${agentId}&mode=form`;
        if (this.nodes.length > 0) {
          signinUrl += '&isWorkFlow=true';
        }
      } else {
        // 业务表单
        signinUrl = `${config.mobileServerUrl}/?corpId=${corpId}&agentId=${agentId}&schemaCode=${schemaCode}&sheetCode=${sheetCode}&id=${id}&mode=form`;
      }

      // signinUrl =`${config.mobileServerUrl}/?workflowInstanceId=${workflowInstanceId}&workItemId=${workItemId}&id=${id}&schemaCode=${schemaCode}&sheetCode=${sheetCode}&corpId=${corpId}&agentId=${agentId}`;
    } else {
      // 查看
      // 数据无数据，生成新表单或者发起流程

      if (workflowCode) {
        // 发起流程
        signinUrl = `${config.mobileServerUrl}/?workflowCode=${workflowCode}&corpId=${corpId}&agentId=${agentId}&mode=form`;
      } else {
        // 新增业务表单
        signinUrl = `${config.mobileServerUrl}/?corpId=${corpId}&agentId=${agentId}&schemaCode=${schemaCode}&sheetCode=${sheetCode}&mode=form`;
      }
      // signinUrl =`${config.mobileServerUrl}/?workflowInstanceId=${workflowInstanceId}&workItemId=${workItemId}&schemaCode=${schemaCode}&sheetCode=${sheetCode}&corpId=${corpId}&agentId=${agentId}`;
    }

    console.log(signinUrl);

    const that = this;
    // const text: string = decodeURI(encodeURIComponent(signinUrl));
    // this.url= `${env.apiHost}/api/qrcode/generate_qrcode?text=${text}`;

    // 将图片二进制流转成base64，兼容IE11
    externalLinkApi.generateQrcode(signinUrl).then((res: any) => {
      let bytes = new Uint8Array(res);
      let data = "";
      let len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        data += String.fromCharCode(bytes[i]);
      }
      that.url = "data:image/png;base64," + window.btoa(data);
    });

    // ygc---费用报销打印
    if(this.isExpense){
      this.expenseData = data;
    }

    // ygc---付款申请打印
    if(this.isPayment){
      this.paymentData = data;
    }
    // debugger
  }
  // ygc---费用报销打印
  printExpense(orderId: string){
    this.doPrint();
  }
  // ygc---付款申请打印
  printPayment(orderId: string){
    this.doPrint();
  }
  // ygc---费用报销付款申请打印
  printWindowPc() {
    if(this.allowPrint && this.isExpense) {
      (this.$refs as any).expenseChild.handlePrint();
    }
    if(this.allowPrint && this.isPayment) {
      (this.$refs as any).paymentChild.handlePrint();
    }
  }
  // ygc---费用报销付款申请打印
  doPrint() {
    if(platform.IS_DINGTALK) {
      this.$confirm({
        title: this.$t("languages.form.printConfirmTitle").toString(),
        content: this.$t("languages.form.printConfirmContent").toString(),
        okText: this.$t("languages.form.go").toString(),
        onOk() {
          let url = location.href + "&access_token=" + localStorage.getItem("token");
          platform.service.openLink(url);
        }
      })
    } else {
      this.printWindowPc();
    }
    // ygc---费用报销付款申请打印
  }
}
</script>


<style lang="less" scoped>
@import "~@/styles/themes/default.less";

.header {
  padding: 0 @base4-padding-lg!important;
  &-left {
    display: flex;
    align-items: center;
  }
  &-dropdown {
    display: flex;
    align-items: center;
    margin-left: 16px;
    padding-left: 16px;
    height: 32px;
    border-left: 1px solid rgba(217, 217, 217, 1);
    .ant-dropdown-trigger{
      & > span {
        display: inline-block;
        max-width: 140px;
        // width: 140px;
      }
    }

  }
  .qrcode {
    border: 1px solid rgba(221, 221, 221, 1);
    // margin-left: 33px;
    margin-right: 16px;
    position: relative;
    & > img {
      width: 26px;
      cursor: url("~@/assets/images/enlarge-o.png"), pointer;
      margin: 2px;
      // border:1px solid rgba(221,221,221,1);
    }
    .qrcode-enlarge {
      position: absolute;
      top: 28px;
      border: 1px solid rgba(221, 221, 221, 1);
      background: #fff;
      img {
        width: 250px;
        height: 250px;
        // max-height: 250px !important;
      }
      p {
        text-align: center;
        padding-bottom: 16px;
      }
      // left: 0;
      right: -1px;
    }
  }
  img.logo {
    cursor: pointer;
    max-height: 30px !important;
  }

  & > div:first-child {
    border-right: 1px solid rgba(217, 217, 217, 1);
    flex-grow: 1;
    display: flex;
    justify-content: space-between;

    a.aback {
      font-size: 18px;
      margin-right: 8px;

      &::after {
        content: "";
        height: 18px;
        width: 1px;
        background-color: #d8d8d8;
        display: inline-block;
        position: relative;
        top: 3px;
        margin-left: 8px;
      }
    }
  }
}
</style>

<style lang="less">
.node-switch-menu-item{
  width: 180px;
  &.a-menu-item-active {
    background:rgba(240,247,255,1);
    font-weight: 600;
  }
}
</style>
