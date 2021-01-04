版本升级备份文档 v1.8.15
1、modules\@cloudpivot\form\src\components\Sheet\components\pc-sheet.vue 和 modules\@cloudpivot\form\src\components\Sheet\components\mobile-sheet.vue 
```
  // ygc-start-修复产品bug：子表下拉框选择字段无法赋值问题
  created(){
    (this.ctrl as any).getCellOptions = this.getOptions;
  }
  getOptions(rowIndex: number, colIndex: number){
    return this.rows[rowIndex][colIndex];
  }
  // ygc-end-修复产品bug：子表下拉框选择字段无法赋值问题
```
2、entries\portal\src\config\axios.ts  entries\mobile\src\config\axios.ts
```
  // ygc--start--修改portal端axios请求拦截器，使在线代码编辑发送第三方接口请求可以使用新token
  const outToken = localStorage.getItem('out_token');
  if (token) {
    debugger
    if(outToken){
      config.headers.Authorization = `${outToken}`;
    }else{
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  // ygc--end--修改portal端axios请求拦截器，使在线代码编辑发送第三方接口请求可以使用新token
```
3、modules\@cloudpivot\list\src\components\pc\list-query-form.vue
```
  <!-- ygc-----start-----所有的关联表单弹窗中的新增按钮去掉 -->
  <!-- <a-button type="primary" @click="addData" v-if="IsShowAdd">{{ $t('cloudpivot.list.pc.Add') }}</a-button> -->
  <!-- ygc-----end-----所有的关联表单弹窗中的新增按钮去掉 -->
```
4、modules\@cloudpivot\form\src\components\Attachment\components\mobile-upload.vue
```
<div class="h3-upload" style="overflow: hidden" :class="isImage ? 'h3-upload-phone' : ''">
```
5、entries\portal\src\views\form\form-detail-header.vue
```
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
  /* ygc---费用报销付款申请自定义打印 */
  import * as platform from "@cloudpivot/platform";
  /* ygc---费用报销付款申请自定义打印 */
  import expensePrint from "../../../extends/songyuprint/expense-print.vue";
  import paymentPrint from "../../../extends/songyuprint/payment-print.vue";
  // ygc自定义打印
  expensePrint, //费用报销打印
  paymentPrint, //付款申请打印
  /* ygc---start---费用报销付款申请自定义打印 */
  isExpense: boolean = false;
  isPayment: boolean = false;
  allowPrint: boolean = true;
  expenseData: any = {};
  paymentData: any = {};
  orderId: string = " ";
  workFlowInfos: any = {};
  /* ygc---end---费用报销付款申请自定义打印 */
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
  // ygc---费用报销打印
    if(this.isExpense){
      this.expenseData = data;
    }
  // ygc---付款申请打印
    if(this.isPayment){
      this.paymentData = data;
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
  
```
6、entries\portal\extends\songyuprint\expense-print.vue
```
<template>
    <div class="container">
        <div class="printBox">
            <p class="printTitle">{{expenseData.company[0].name ? expenseData.company[0].name : ''}}-员工费用报销</p>
            <div class="printDescribe"><span class="firstDes">编号：{{expenseData.sequenceNo ? expenseData.sequenceNo : ''}}</span><span class="secondDes">申请日期：{{expenseData.createdTime ? expenseData.createdTime : ''}}</span></div>
            <table
                class="expense-print-table"
                cellspacing="0"
                border="1"
                style="border-collapse:collapse;"
                width="800">
                <tbody class="tbody">
                    <tr height="30">
                        <td>经办人</td>
                        <td>{{expenseData.user_name ? expenseData.user_name[0].name : ''}}</td>
                        <td>工号</td>
                        <td>{{expenseData.job_code ? expenseData.job_code : ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>报销公司名称</td>
                        <td>{{expenseData.company ? expenseData.company[0].name : ''}}</td>
                        <td>部门&岗位</td>
                        <td>{{expenseData.department ? expenseData.department[0].name : ''}} / {{expenseData.position ? expenseData.position : ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>收方银行</td>
                        <td>{{expenseData.recipient_bank ? expenseData.recipient_bank : ''}}</td>
                        <td>收方银行账号</td>
                        <td>{{expenseData.recipient_bank_code ? expenseData.recipient_bank_code : ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>erp凭证编号</td>
                        <td>{{expenseData.erpcode ? expenseData.erpcode : ''}}</td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr height="30">
                        <td>实际支付金额</td>
                        <td>{{expenseData.actual_amount ? expenseData.actual_amount + ' 元' : ''}}</td>
                        <td>金额大写</td>
                        <td>{{expenseData.amount_capitalize ? expenseData.amount_capitalize: ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>摘要</td>
                        <td colspan="3">{{expenseData.introduction ? expenseData.introduction : ''}}</td>
                    </tr>
                </tbody>
            </table>
            <table
                class="expense-print-workflow"
                cellspacing="0"
                border="1"
                style="border-collapse:collapse;"
                width="800">
                <thead>
                    <tr height="30">
                        <th colspan="6">流程审批记录</th>
                    </tr>
                </thead>
                <tbody v-for="(itemm, index) in this.approvals" :key="index" class="tbody">
                    <div v-for="item in itemm.nodes">
                        <tr height="30" v-if="item.workActionType === 0 || item.workActionType === 1 || item.workActionType === 3">
                            <td width="60">{{index === 0 ? '申请人' : '审核人'}}</td>
                            <td width="180">{{item.dept ? item.dept : ''}} / {{item.approvaler.name ? item.approvaler.name : ''}}</td>
                            <td width="100">流程状态</td>
                            <td>{{transIdea(item.workActionType)}}</td>
                            <td width="100">审批时间</td>
                            <td>{{item.approvalTime ? item.approvalTime : ''}}</td>
                        </tr>
                        <tr height="30" v-if="item.workActionType === 0 || item.workActionType === 1 || item.workActionType === 3">
                            <td width="80">流程节点</td>
                            <td>{{itemm.activityName ? itemm.activityName : ''}}</td>
                            <td width="100">审批意见</td>
                            <td width="50" colspan="3">{{item.bizComment ? item.bizComment.content : ''}}</td>
                        </tr>
                    </div>
                </tbody>
            </table>
        </div>
        <iframe
            id="printiframeBox"
            src=""
            width="0"
            height="0"
            frameborder="0">
        </iframe>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue, Watch } from "vue-property-decorator";
    import common from "@cloudpivot/common";
    import * as applicationList from "@cloudpivot/list";
    import * as pcForm from "@cloudpivot/form/pc";
    import { Button, Row, Col, Table } from "h3-antd-vue";
    import { workflow, workflowApi, user } from "@cloudpivot/api";
    import flow from "@cloudpivot/flow/pc";

    @Component({
        name: 'expensePrint',
        components: {
            AButton: Button,
            ARow: Row,
            ACol: Col,
            ATable: Table,
        }
    })
    export default class expensePrint extends Vue {
        approvals:Array<any> = []; // 流程实例

        @Prop(Object) expenseData!: object;
        @Prop(Object) workFlowInfos!: object;
        @Prop() workflowInstanceId!: string;

        beforeMount () {
            this.getWorkflowInfos(this.workflowInstanceId);
        }

        transIdea(workActionType: number){
            let returnTit:string = '';
            switch(workActionType){
                case 0:
                    returnTit = '提交';
                break;
                case 1:
                    returnTit = '提交';
                break;
                case 2:
                    returnTit = '作废';
                break;
                case 3:
                    returnTit = '同意';
                break;
                case 4:
                    returnTit = '不同意';
                break;
                case 5:
                    returnTit = '加签';
                break;
                case 6:
                    returnTit = '协办';
                break;
                case 7:
                    returnTit = '转办';
                break;
                case 8:
                    returnTit = '驳回';
                break;
                case 9:
                    returnTit = '结束流程';
                break;
                case 10:
                    returnTit = '待阅';
                break;
                case 11:
                    returnTit = '已阅';
                break;
                case 12:
                    returnTit = '进行中';
                break;
                case 14:
                    returnTit = '被取消';
                break;
            }
            return returnTit;
        }

        getWorkflowInfos(id:string){
            if (id) {
                workflowApi.getApproval({
                    workflowInstanceId: id
                }).then(res => {
                    if (res.errcode === 0) {
                        if (Array.isArray(res.data)) {
                            res.data.forEach((d: any) => {
                                common.utils.compatible(d, 'activityName');
                            });
                        }
                        this.approvals = res.data || [];
                    } else {
                        this.approvals = [];
                    }
                });
            } else {
                this.approvals = [];
            }
        }

        handlePrint(){
            var newStr = document.getElementsByClassName("printBox")[0].innerHTML;
            const f:any = document.getElementById("printiframeBox");
            f.contentDocument.write(`<style type="text/css">
            body,div,p,ol,ul,li,dl,dd,dt,form,input,table,tr,td,textarea,figure,fieldset,h1,h2,h3,h4,h5,h6{
                margin:0;
                padding:0;
            }
            .printBox {
                padding: 20px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 980px;
            }
            .printTitle{
                margin: 40px 0 20px 0;
                text-align: center;
                font-size: 26px;
                font-weight: 500;
            }
            .printDescribe{
                font-size: 16px;
                font-weight: 500;
                display: flex;
                flex-direction: row;
                justify-content: space-around;
                margin-bottom: 20px;
            }
            .tbody{
                text-align: center;
            }
            .expense-print-table{
                margin-bottom: 20px;
            }
            </style>`);
            f.contentDocument.write(newStr); // 写入到新的iframe窗口
            f.contentDocument.close();
            f.contentWindow.print(); // 在新的iframe窗口调用浏览器打印机
            console.log(this.expenseData, 'expenseData', this.approvals, '111');
        }
    }
</script>
<style lang='less' scoped>
</style>
```
7、entries\portal\extends\songyuprint\payment-print.vue
```
<template>
    <div class="container">
        <div class="printBox">
            <p class="printTitle">{{paymentData.company[0].name ? paymentData.company[0].name : ''}}-员工付款申请</p>
            <div class="printDescribe"><span class="firstDes">编号：{{paymentData.sequenceNo ? paymentData.sequenceNo : ''}}</span><span class="secondDes">申请日期：{{paymentData.createdTime ? paymentData.createdTime : ''}}</span></div>
            <table
                class="payment-print-table"
                cellspacing="0"
                border="1"
                style="border-collapse:collapse;"
                width="800">
                <tbody class="tbody">
                    <tr height="30">
                        <td>经办人</td>
                        <td>{{paymentData.user_name ? paymentData.user_name[0].name : ''}}</td>
                        <td>工号</td>
                        <td>{{paymentData.job_code ? paymentData.job_code : ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>报销公司名称</td>
                        <td>{{paymentData.company ? paymentData.company[0].name : ''}}</td>
                        <td>部门&岗位</td>
                        <td>{{paymentData.department ? paymentData.department[0].name : ''}} / {{paymentData.position ? paymentData.position : ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>收方户名</td>
                        <td>{{paymentData.recipient_name ? paymentData.recipient_name : ''}}</td>
                        <td>erp凭证编号</td>
                        <td>{{paymentData.erpcode ? paymentData.erpcode : ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>开户银行</td>
                        <td>{{paymentData.recipient_bank ? paymentData.recipient_bank : ''}}</td>
                        <td>收方银行账号</td>
                        <td>{{paymentData.recipient_bank_code ? paymentData.recipient_bank_code : ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>实际支付金额</td>
                        <td>{{paymentData.actual_amount ? paymentData.actual_amount + ' 元' : ''}}</td>
                        <td>金额大写</td>
                        <td>{{paymentData.amount_cap ? paymentData.amount_cap: ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>用途</td>
                        <td colspan="3">{{paymentData.introduction ? paymentData.introduction : ''}}</td>
                    </tr>
                </tbody>
            </table>
            <table
                class="payment-print-workflow"
                cellspacing="0"
                border="1"
                style="border-collapse:collapse;"
                width="800">
                <thead>
                    <tr height="30">
                        <th colspan="6">流程审批记录</th>
                    </tr>
                </thead>
                <tbody v-for="(itemm, index) in this.approvals" :key="index" class="tbody">
                    <div v-for="item in itemm.nodes">
                        <tr height="30" v-if="item.workActionType === 0 || item.workActionType === 1 || item.workActionType === 3">
                            <td width="60">{{index === 0 ? '申请人' : '审核人'}}</td>
                            <td width="180">{{item.dept ? item.dept : ''}} / {{item.approvaler.name ? item.approvaler.name : ''}}</td>
                            <td width="100">流程状态</td>
                            <td>{{transIdea(item.workActionType)}}</td>
                            <td width="100">审批时间</td>
                            <td>{{item.approvalTime ? item.approvalTime : ''}}</td>
                        </tr>
                        <tr height="30" v-if="item.workActionType === 0 || item.workActionType === 1 || item.workActionType === 3">
                            <td width="80">流程节点</td>
                            <td>{{itemm.activityName ? itemm.activityName : ''}}</td>
                            <td width="100">审批意见</td>
                            <td width="50" colspan="3">{{item.bizComment ? item.bizComment.content : ''}}</td>
                        </tr>
                    </div>
                </tbody>
            </table>
        </div>
        <iframe
            id="printiframeBox"
            src=""
            width="0"
            height="0"
            frameborder="0">
        </iframe>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue, Watch } from "vue-property-decorator";
    import common from "@cloudpivot/common";
    import * as applicationList from "@cloudpivot/list";
    import * as pcForm from "@cloudpivot/form/pc";
    import { Button, Row, Col, Table } from "h3-antd-vue";
    import { workflow, workflowApi, user } from "@cloudpivot/api";
    import flow from "@cloudpivot/flow/pc";

    @Component({
        name: 'paymentPrint',
        components: {
            AButton: Button,
            ARow: Row,
            ACol: Col,
            ATable: Table,
        }
    })
    export default class paymentPrint extends Vue {
        approvals:Array<any> = []; // 流程实例
        @Prop(Object) paymentData!: object;
        @Prop(Object) workFlowInfos!: object;
        @Prop() workflowInstanceId!: string;

        beforeMount () {
            this.getWorkflowInfos(this.workflowInstanceId);
        }

        transIdea(workActionType: number){
            let returnTit:string = '';
            switch(workActionType){
                case 0:
                    returnTit = '提交';
                break;
                case 1:
                    returnTit = '提交';
                break;
                case 2:
                    returnTit = '作废';
                break;
                case 3:
                    returnTit = '同意';
                break;
                case 4:
                    returnTit = '不同意';
                break;
                case 5:
                    returnTit = '加签';
                break;
                case 6:
                    returnTit = '协办';
                break;
                case 7:
                    returnTit = '转办';
                break;
                case 8:
                    returnTit = '驳回';
                break;
                case 9:
                    returnTit = '结束流程';
                break;
                case 10:
                    returnTit = '待阅';
                break;
                case 11:
                    returnTit = '已阅';
                break;
                case 12:
                    returnTit = '进行中';
                break;
                case 14:
                    returnTit = '被取消';
                break;
            }
            return returnTit;
        }

        getWorkflowInfos(id:string){
            if (id) {
                workflowApi.getApproval({
                    workflowInstanceId: id
                }).then(res => {
                    if (res.errcode === 0) {
                        if (Array.isArray(res.data)) {
                            res.data.forEach((d: any) => {
                                common.utils.compatible(d, 'activityName');
                            });
                        }
                        this.approvals = res.data || [];
                    } else {
                        this.approvals = [];
                    }
                });
            } else {
                this.approvals = [];
            }
        }

        handlePrint(){
            var newStr = document.getElementsByClassName("printBox")[0].innerHTML;
            const f:any = document.getElementById("printiframeBox");
            f.contentDocument.write(`<style type="text/css">
            body,div,p,ol,ul,li,dl,dd,dt,form,input,table,tr,td,textarea,figure,fieldset,h1,h2,h3,h4,h5,h6{
                margin:0;
                padding:0;
            }
            .printBox {
                padding: 20px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 980px;
            }
            .printTitle{
                margin: 40px 0 20px 0;
                text-align: center;
                font-size: 26px;
                font-weight: 500;
            }
            .printDescribe{
                font-size: 16px;
                font-weight: 500;
                display: flex;
                flex-direction: row;
                justify-content: space-around;
                margin-bottom: 20px;
            }
            .tbody{
                text-align: center;
            }
            .payment-print-table{
                margin-bottom: 20px;
            }
            </style>`);
            f.contentDocument.write(newStr); // 写入到新的iframe窗口
            f.contentDocument.close();
            f.contentWindow.print(); // 在新的iframe窗口调用浏览器打印机
            // console.log(this.paymentData, 'paymentData', this.approvals, '111');
        }
    }
</script>
```
8、modules\@cloudpivot\list\src\components\pc\application-list.vue
```
    <!-- ygc---start---自定义pdf批量打印--费用报销付款申请列表页pdf批量打印 -->
    <template v-if="curTitle === '员工费用报销' || curTitle === '资金付款审批'">
        <a-button @click="selectPrintPdf(curTitle)">PDF批量打印</a-button>
    </template>
    <expense-print 
        :expenseData="expenseData"
        ref="expenseChild"
        v-if="this.isExpense"
        v-show="false"
    />
    <payment-print 
        :paymentData="paymentData"
        ref="paymentChild"
        v-if="this.isPayment"
        v-show="false"
    />
    <!-- ygc---end---自定义pdf批量打印--费用报销付款申请列表页pdf批量打印 -->
```
9、modules\@cloudpivot\list\src\components\pc\components\custom-print\expense-print.vue
```
<template>
    <div class="container">
        <div class="printBox">
            <table
                class="expense-print-table"
                cellspacing="0"
                style="border-collapse: collapse;"
                v-for="(item, index) in expenseData"
                :key="index"
                border="1"
                width="800">
                <thead class="thead">
                    <tr height="50" class="printHeader">
                        <th colspan="4">{{item.major.company ? item.major.company : ''}}-员工费用报销</th>
                    </tr>
                    <tr height="40" class="printDes">
                        <th colspan="2">编号：{{item.major.sequenceno ? item.major.sequenceno : ''}}</th>
                        <th colspan="2">申请日期：{{item.major.createdtime ? item.major.createdtime : ''}}</th>
                    </tr>
                </thead>
                <tbody class="tbody">
                    <tr height="30">
                        <td>经办人</td>
                        <td>{{item.major.userName ? item.major.userName : ''}}</td>
                        <td>工号</td>
                        <td>{{item.major.jobCode ? item.major.jobCode : ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>报销公司名称</td>
                        <td>{{item.major.company ? item.major.company : ''}}</td>
                        <td>部门&岗位</td>
                        <td>{{item.major.department ? item.major.department : ''}} / {{item.major.position ? item.major.position : ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>收方银行</td>
                        <td>{{item.major.recipientBank ? item.major.recipientBank : ''}}</td>
                        <td>收方银行账号</td>
                        <td>{{item.major.recipientBankCode ? item.major.recipientBankCode : ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>erp凭证编号</td>
                        <td>{{item.major.erpcode ? item.major.erpcode : ''}}</td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr height="30">
                        <td>实际支付金额</td>
                        <td>{{item.major.actualAmount ? item.major.actualAmount + ' 元' : ''}}</td>
                        <td>金额大写</td>
                        <td>{{item.major.amountCap ? item.major.amountCap: ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>摘要</td>
                        <td colspan="3">{{item.major.introduction ? item.major.introduction : ''}}</td>
                    </tr>
                    <tr height="30" class="specTr">
                        <td colspan="4">流程审批记录</td>
                    </tr>
                    <div v-for="(itemm, indexx) in item.workItemApprovals">
                        <div v-for="itemmm in itemm.nodes">
                            <tr height="30" v-if="itemmm.workActionType === 0 || itemmm.workActionType === 1 || itemmm.workActionType === 3">
                                <td>{{indexx === 0 ? '申请人' : '审核人'}}</td>
                                <td>{{itemmm.dept ? itemmm.dept : ''}} / {{itemmm.approvaler.name ? itemmm.approvaler.name : ''}}</td>
                                <td>流程状态</td>
                                <td>{{transIdea(itemmm.workActionType)}}</td>
                            </tr>
                            <tr height="30" v-if="itemmm.workActionType === 0 || itemmm.workActionType === 1 || itemmm.workActionType === 3">
                                <td>审核时间</td>
                                <td>{{itemmm.approvalTime ? itemmm.approvalTime : ''}}</td>
                                <td>流程节点</td>
                                <td>{{itemm.activityName ? itemm.activityName : ''}}</td>
                            </tr>
                            <tr height="30" v-if="itemmm.workActionType === 0 || itemmm.workActionType === 1 || itemmm.workActionType === 3">
                                <td>审批意见</td>
                                <td colspan="3">{{itemmm.bizComment ? itemmm.bizComment.content : ''}}</td>
                            </tr>
                        </div>
                    </div>
                </tbody>
            </table>
        </div>
        <iframe
            id="printiframeBox"
            src=""
            width="0"
            height="0">
        </iframe>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue, Watch } from "vue-property-decorator";
    @Component({
        name: 'expensePrint',
        components: {
            
        }
    })
    export default class expensePrint extends Vue {
        @Prop(Array) expenseData!: [];

        transIdea(workActionType: number){
            let returnTit:string = '';
            switch(workActionType){
                case 0:
                    returnTit = '提交';
                break;
                case 1:
                    returnTit = '提交';
                break;
                case 2:
                    returnTit = '作废';
                break;
                case 3:
                    returnTit = '同意';
                break;
                case 4:
                    returnTit = '不同意';
                break;
                case 5:
                    returnTit = '加签';
                break;
                case 6:
                    returnTit = '协办';
                break;
                case 7:
                    returnTit = '转办';
                break;
                case 8:
                    returnTit = '驳回';
                break;
                case 9:
                    returnTit = '结束流程';
                break;
                case 10:
                    returnTit = '待阅';
                break;
                case 11:
                    returnTit = '已阅';
                break;
                case 12:
                    returnTit = '进行中';
                break;
                case 14:
                    returnTit = '被取消';
                break;
            }
            return returnTit;
        }
        handlePrint(){
            var newStr = document.getElementsByClassName("printBox")[0].innerHTML;
            const f:any = document.getElementById("printiframeBox");
            f.contentDocument.write(`<style type="text/css">
            body,div,p,ol,ul,li,dl,dd,dt,form,input,table,tr,td,textarea,figure,fieldset,h1,h2,h3,h4,h5,h6{
                margin:0;
                padding:0;
            }
            @media print{
                table {
                    page-break-before: always;
                }
            }
            .printBox {
                padding: 20px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 980px;
            }
            .thead{
                text-align: center;
            }
            .printHeader{
                font-size: 30px;
                font-weight: 500;
                border-top: 1px solid transparent!important;
                border-left: 1px solid transparent!important;
                border-right: 1px solid transparent!important;
            }
            .printDes{
                font-size: 20px;
                font-weight: 300;
                border-top: 1px solid transparent!important;
                border-left: 1px solid transparent!important;
                border-right: 1px solid transparent!important;
            }
            .tbody{
                text-align: center;
            }
            .expense-print-table{
                margin-bottom: 20px;
                padding-top: 30px;
            }
            .specTr{
                border-left: 1px solid transparent!important;
                border-right: 1px solid transparent!important;
                font-size: 18px;
                font-weight: 500;
            }
            </style>`);
            f.contentDocument.write(newStr); // 写入到新的iframe窗口
            f.contentDocument.close();
            f.contentWindow.print(); // 在新的iframe窗口调用浏览器打印机
            // console.log(this.expenseData, 'expenseData', '111');
        }
    }
</script>
```
10、modules\@cloudpivot\list\src\components\pc\components\custom-print\peyment-print.vue
```
<template>
    <div class="container">
        <div class="printBox">
            <table
                class="payment-print-table"
                cellspacing="0"
                style="border-collapse: collapse;"
                v-for="(item, index) in paymentData"
                :key="index"
                border="1"
                width="800">
                <thead class="thead">
                    <tr height="50" class="printHeader">
                        <th colspan="4">{{item.major.company ? item.major.company : ''}}-员工付款申请</th>
                    </tr>
                    <tr height="40" class="printDes">
                        <th colspan="2">编号：{{item.major.sequenceno ? item.major.sequenceno : ''}}</th>
                        <th colspan="2">申请日期：{{item.major.createdtime ? item.major.createdtime : ''}}</th>
                    </tr>
                </thead>
                <tbody class="tbody">
                    <tr height="30">
                        <td>经办人</td>
                        <td>{{item.major.userName ? item.major.userName : ''}}</td>
                        <td>工号</td>
                        <td>{{item.major.jobCode ? item.major.jobCode : ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>报销公司名称</td>
                        <td>{{item.major.company ? item.major.company : ''}}</td>
                        <td>部门&岗位</td>
                        <td>{{item.major.department ? item.major.department : ''}} / {{item.major.position ? item.major.position : ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>收方户名</td>
                        <td>{{item.major.recipientName ? item.major.recipientName : ''}}</td>
                        <td>erp凭证编号</td>
                        <td>{{item.major.erpcode ? item.major.erpcode : ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>开户银行</td>
                        <td>{{item.major.recipientBank ? item.major.recipientBank : ''}}</td>
                        <td>收方银行账号</td>
                        <td>{{item.major.recipientBankCode ? item.major.recipientBankCode : ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>实际支付金额</td>
                        <td>{{item.major.actualAmount ? item.major.actualAmount + ' 元' : ''}}</td>
                        <td>金额大写</td>
                        <td>{{item.major.amountCap ? item.major.amountCap: ''}}</td>
                    </tr>
                    <tr height="30">
                        <td>用途</td>
                        <td colspan="3">{{item.major.introduction ? item.major.introduction : ''}}</td>
                    </tr>
                    <tr height="30" class="specTr">
                        <td colspan="4">流程审批记录</td>
                    </tr>
                    <div v-for="(itemm, indexx) in item.workItemApprovals">
                        <div v-for="itemmm in itemm.nodes">
                            <tr height="30" v-if="itemmm.workActionType === 0 || itemmm.workActionType === 1 || itemmm.workActionType === 3">
                                <td>{{indexx === 0 ? '申请人' : '审核人'}}</td>
                                <td>{{itemmm.dept ? itemmm.dept : ''}} / {{itemmm.approvaler.name ? itemmm.approvaler.name : ''}}</td>
                                <td>流程状态</td>
                                <td>{{transIdea(itemmm.workActionType)}}</td>
                            </tr>
                            <tr height="30" v-if="itemmm.workActionType === 0 || itemmm.workActionType === 1 || itemmm.workActionType === 3">
                                <td>审核时间</td>
                                <td>{{itemmm.approvalTime ? itemmm.approvalTime : ''}}</td>
                                <td>流程节点</td>
                                <td>{{itemm.activityName ? itemm.activityName : ''}}</td>
                            </tr>
                            <tr height="30" v-if="itemmm.workActionType === 0 || itemmm.workActionType === 1 || itemmm.workActionType === 3">
                                <td>审批意见</td>
                                <td colspan="3">{{itemmm.bizComment ? itemmm.bizComment.content : ''}}</td>
                            </tr>
                        </div>
                    </div>
                </tbody>
            </table>
        </div>
        <iframe
            id="printiframeBox"
            src=""
            width="0"
            height="0">
        </iframe>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue, Watch } from "vue-property-decorator";
    @Component({
        name: 'paymentPrint',
        components: {
            
        }
    })
    export default class expensePrint extends Vue {
        @Prop(Array) paymentData!: [];

        transIdea(workActionType: number){
            let returnTit:string = '';
            switch(workActionType){
                case 0:
                    returnTit = '提交';
                break;
                case 1:
                    returnTit = '提交';
                break;
                case 2:
                    returnTit = '作废';
                break;
                case 3:
                    returnTit = '同意';
                break;
                case 4:
                    returnTit = '不同意';
                break;
                case 5:
                    returnTit = '加签';
                break;
                case 6:
                    returnTit = '协办';
                break;
                case 7:
                    returnTit = '转办';
                break;
                case 8:
                    returnTit = '驳回';
                break;
                case 9:
                    returnTit = '结束流程';
                break;
                case 10:
                    returnTit = '待阅';
                break;
                case 11:
                    returnTit = '已阅';
                break;
                case 12:
                    returnTit = '进行中';
                break;
                case 14:
                    returnTit = '被取消';
                break;
            }
            return returnTit;
        }
        handlePrint(){
            var newStr = document.getElementsByClassName("printBox")[0].innerHTML;
            const f:any = document.getElementById("printiframeBox");
            f.contentDocument.write(`<style type="text/css">
            body,div,p,ol,ul,li,dl,dd,dt,form,input,table,tr,td,textarea,figure,fieldset,h1,h2,h3,h4,h5,h6{
                margin:0;
                padding:0;
            }
            @media print{
                table {
                    page-break-before: always;
                }
            }
            .printBox {
                padding: 20px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 980px;
            }
            .thead{
                text-align: center;
            }
            .printHeader{
                font-size: 30px;
                font-weight: 500;
                border-top: 1px solid transparent!important;
                border-left: 1px solid transparent!important;
                border-right: 1px solid transparent!important;
            }
            .printDes{
                font-size: 20px;
                font-weight: 300;
                border-top: 1px solid transparent!important;
                border-left: 1px solid transparent!important;
                border-right: 1px solid transparent!important;
            }
            .tbody{
                text-align: center;
            }
            .payment-print-table{
                margin-bottom: 20px;
                padding-top: 30px;
            }
            .specTr{
                border-left: 1px solid transparent!important;
                border-right: 1px solid transparent!important;
                font-size: 18px;
                font-weight: 500;
            }
            </style>`);
            f.contentDocument.write(newStr); // 写入到新的iframe窗口
            f.contentDocument.close();
            f.contentWindow.print(); // 在新的iframe窗口调用浏览器打印机
            // console.log(this.paymentData, 'paymentData', '111');
        }
    }
</script>
```
11、modules\@cloudpivot\list\src\components\pc\scripts\application-list.ts
```
    /* ygc---start---费用报销付款申请列表页自定义批量打印 */
    import expensePrint from "../components/custom-print/expense-print.vue";
    import paymentPrint from "../components/custom-print/payment-print.vue";
    /* ygc---end---费用报销付款申请列表页自定义批量打印 */
    expensePrint, // ygc---start---费用报销付款申请列表页自定义批量打印
    paymentPrint  // ygc---end---费用报销付款申请列表页自定义批量打印
    // ygc---start---列表页pdf自定义批量打印
    isExpense:boolean = false;
    isPayment:boolean = false;
    expenseData: Array<any> = [];
    paymentData: Array<any> = [];
    // ygc---end---列表页pdf自定义批量打印
	/* -----------ygc---start---自定义pdf批量打印---打印方法 */
	doPrint(){
		if(platform.IS_DINGTALK){
			this.$confirm({
				title: this.$t("languages.form.printConfirmTitle").toString(),
				content: this.$t("languages.form.printConfirmContent").toString(),
				okText: this.$t("languages.form.go").toString(),
				onOk() {
				  let url = location.href + "&access_token=" + localStorage.getItem("token");
				  platform.service.openLink(url);
				}
			})
		}else{
			this.printWindowPc();
		}
	}
	printWindowPc(){
		if(this.isExpense) {
			(this.$refs as any).expenseChild.handlePrint();
		}
		if(this.isPayment) {
			(this.$refs as any).paymentChild.handlePrint();
		}
	}
	/* -----------ygc---end---自定义pdf批量打印---打印方法 */
    /*-----------ygc---start---自定义pdf批量打印--费用报销付款申请列表页pdf批量打印-----------*/
	selectPrintPdf(curTitle: string){
		if(curTitle === '员工费用报销'){
			this.isExpense = true;
		}
		if(curTitle === '资金付款审批'){
			this.isPayment = true;
		}
		console.log('111111');
		let loading:any = this.$message.loading('生成打印预览中，请稍等...', 0);
		if(curTitle === '员工费用报销' || curTitle === '资金付款审批'){
			let checkedList:Array<any> = [];
			this.checkeds.forEach((item:any, index:any)=>{
				if(item){
					checkedList.push(index);
				}
			});
			// console.log(checkedList, 'checkedList');
			let selectDataSource = this.dataSource;
			let result:Array<any> = [];
			for(let i = 0;i < checkedList.length;i++){
				selectDataSource.forEach((item,index)=>{
					if(index === checkedList[i]){
						result.push(item.id);
					}
				});
			}
			// console.log(result, '???');
			let getToken = window.localStorage.getItem('token');
			if(result.length > 0 && result.length <= 10){
				let that = this;
				let canPrint: boolean = false;
				axios({
					method: 'post',
					url: 'http://113.12.64.58:88/api/ext/v1/print/batch_print',
					data: {
						ids: result
					},
					headers: {
						'Content-Type': 'application/json',
            			'token': getToken
					}
				}).then((res:any) => {
					if(res && res.errcode == 0){
						loading();
						console.log(res.data, '打印数据');
						if(that.isExpense){
							that.expenseData = res.data;
						}
						if(that.paymentData){
							that.paymentData = res.data;
						}
						canPrint = true;
					}else{
						canPrint = false;
						that.$message.error('未获取到打印数据');
						loading();
					}
				}).then(()=>{
					if(canPrint){
						that.doPrint();
					}
				}).catch(err => {
					that.$message.error(err);
					loading();
				});
			}else if(result.length > 10){
				this.$message.error('一次最多只能打印10条数据');
			}else if(result.length <= 0){
				this.$message.error('请先勾选要打印的数据');
			}
		}
	}
	/*-----------ygc---end---自定义pdf批量打印--费用报销付款申请列表页pdf批量打印-----------*/
```
12、modules/@cloudpivot/form/src/common/components/form-staff-selector/controls/staff-selector-control.ts
```
    /* ygc---start---解决移动端所在公司映射问题--- */
    if((!this.controlOpts.mappings && !this.controlOpts.defaultValue) || this.isMobile){
    let newVal = [...val];
    this.setValue(newVal);
    }
    /* ygc---end---解决移动端所在公司映射问题--- */
    /* ygc---start---解决移动端所在公司映射问题--- */
    get isMobile() {
        const flag = navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i);
        return flag;
    }
    /* ygc---end---解决移动端所在公司映射问题--- */
```
13、entries\admin\src\assets\images\somgyu.png
entries\portal\src\assets\images\songyu.png
entries\portal\src\views\shared\permission\songyu.png
modules\@cloudpivot\common\src\components\pc\enpty-header\images\songyu.png
14、entries\admin\src\components\global\header\defaultHeader.vue
```
<img class="logo" src="~assets/images/songyu.png" />
```
15、entries\admin\src\views\error\empty.vue
```
<img src="@/assets/images/songyu.png">
```
16、entries\admin\src\views\error\permission.vue
```
<img src="@/assets/images/songyu.png">
```
17、entries\admin\src\views\error\form-unpublished.vue
```
<img src="@/assets/images/songyu.png">
```
18、entries\admin\src\views\error\success.vue
```
<img src="@/assets/images/songyu.png">
```
19、entries\portal\public\no-permission.html
```
<img src="./songyu.png" />
```
20、entries\portal\src\components\shared\header\empty-header.vue
```
<img src="@/assets/images/songyu.png">
```
21、entries\portal\src\config\site.ts
```
    title: '松宇集团',
    logo: require('@/assets/images/songyu.png'),
```
22、entries\portal\src\views\form\workflow-track\operation-log-compare.vue
```
<img class="yslogo" src="../../../assets/images/songyu.png" alt="">
```
23、entries\portal\src\views\login\login.vue
```
<img src="../../assets/images/songyu.png" />
```
24、entries\portal\src\views\loginError\index.vue
```
<img src="../../assets/images/songyu.png" />
```
25、entries\portal\src\views\shared\empty.vue
```
<img src="@/assets/images/songyu.png">
```
26、entries\portal\src\views\shared\success.vue
```
<img src="@/assets/images/songyu.png">
```
27、entries\portal\src\views\shared\permission\permission.vue
```
<img src="./songyu.png"/>
```
28、modules\@cloudpivot\common\src\components\pc\empty-header\empty-header.vue
```
<img src="./images/songyu.png">
```
29、entries\portal\extends\songyureport\applicationExpense.vue
```
<template>
    <div class='application-box'>
        <div class="search-area">
            <div class="search-patten">
                <div class="search-title">
                    <i class="search-icon"></i>
                    <p class="search-tip">请选择类型：</p>
                </div>
                <div class="search-option">
                    <a-select
                    style="width: 100%;"
                    allowClear
                    placeholder="请选择流程类型"
                    v-model="searchPatten"
                    @change="handleChange">
                        <a-select-option :key="selectItem.index" :value="selectItem.code" v-for="(selectItem, index) in selectOptions">
                            {{selectItem.name}}
                        </a-select-option>
                    </a-select>
                </div>
            </div>
            <div class="search-staff">
                <div class="search-title">
                    <i class="search-icon"></i>
                    <p class="search-tip">请选择参与人：</p>
                </div>
                <div class="search-name">
                    <staff-select
                        v-model="selectNames"
                        :options="selectOpts"
                        @change="staffSelectChange"
                    ></staff-select>
                </div>
            </div>
            <div class="search-time">
                <div class="search-title">
                    <i class="search-icon"></i>
                    <p class="search-tip">请选择起止时间：</p>
                </div>
                <div class="time-picker">
                    <a-range-picker
                    :placeholder="['开始时间','结束时间']"
                    format="YYYY-MM-DD"
                    v-model="searchTimes"
                    @change="onChangeTimes"
                    />
                </div>
            </div>
        </div>
        <div class="data-table">
            <div class="table-describe">
                <div class="search-left">
                    <i class="search-icon"></i>
                    <p class="search-tip">数量统计表</p>
                </div>
                <a-button class="search-btn" size="small" @click="excelExport">Excel导出</a-button>
            </div>
            <table class="table-first" cellspacing="0" border="1">
                <thead class="thead" style="color: rgba(255, 255, 58, 1);">
                    <tr height="25">
                        <th>姓名</th>
                        <th>累计参与</th>
                        <th>待办</th>
                        <th>已办</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody class="tbody" style="color: rgba(255, 255, 58, 1);">
                    <tr height="25" v-for="(item, index) in returnCountDatas">
                        <td>{{item.userName}}</td>
                        <td>{{item.allCount}}</td>
                        <td>{{item.count}}</td>
                        <td>{{item.finishCount}}</td>
                        <td><a-tag color="green" @click="preClick(item.userName, false)">代办</a-tag><a-tag color="cyan" @click="hadClick(item.userName, true)">已办</a-tag></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="data-table2">
            <div class="table-describe">
                <div class="search-left">
                    <i class="search-icon"></i>
                    <p class="search-tip">详细信息表</p>
                </div>
            </div>
            <table class="table-second" cellspacing="0" border="1" v-if="isWhitch">
                <thead class="thead" style="color: rgba(255, 255, 58, 1);">
                    <tr height="25">
                        <th>发起人</th>
                        <th>审批节点</th>
                        <th>审批人</th>
                        <th>接收时间</th>
                        <th>处理用时</th>
                        <th>流程创建时间</th>
                        <th>流程结束时间</th>
                    </tr>
                </thead>
                <tbody class="tbody" style="color: rgba(255, 255, 58, 1);">
                    <tr height="25" v-for="(item, index) in unDoneDatas.list">
                        <td>{{item.originatorname}}</td>
                        <td>{{item.activityname}}</td>
                        <td>{{item.participantname}}</td>
                        <td>{{item.starttime}}</td>
                        <td>{{secondsToHours(item.usedtime)}}</td>
                        <td>{{item.instanceStartTime}}</td>
                        <td>{{item.instanceFinishTime}}</td>
                    </tr>
                </tbody>
            </table>
            <table class="table-second" cellspacing="0" border="1" v-else>
                <thead class="thead" style="color: rgba(255, 255, 58, 1);">
                    <tr height="25">
                        <th>发起人</th>
                        <th>审批节点</th>
                        <th>审批人</th>
                        <th>接收时间</th>
                        <th>流程创建时间</th>
                    </tr>
                </thead>
                <tbody class="tbody" style="color: rgba(255, 255, 58, 1);">
                    <tr height="25" v-for="(item, index) in unDoneDatas.list">
                        <td>{{item.originatorname}}</td>
                        <td>{{item.activityname}}</td>
                        <td>{{item.participantname}}</td>
                        <td>{{item.starttime}}</td>
                        <td>{{item.instanceStartTime}}</td>
                    </tr>
                </tbody>
            </table>
            <div class="pagination">
                <a-pagination
                    :current="curPage"
                    :total="totalElements"
                    :pageSize="pageSize"
                    :pageSizeOptions="pageSizeOptions"
                    :defaultPageSize="10"
                    showSizeChanger
                    showQuickJumper
                    :showTotal="total => `共${totalElements}条`"
                    @change="pageChange"
                    @showSizeChange="pageSizeChange"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import moment from 'moment';
import axios from 'axios';
import { Component, Prop, Vue, Watch, Emit, Model } from 'vue-property-decorator';
import common from '@cloudpivot/common';
import locale from '@h3/antd-vue/es/locale-provider/zh_CN';
import * as applicationList from '@cloudpivot/list';
import StaffSelect from '@cloudpivot/form/src/common/components/form-staff-selector/pc/staff-selector.vue';
import { schema, renderer } from "@cloudpivot/form";
import rendererComponents from '@cloudpivot/form/src/renderer/components/pc';
// import { ModalAttributeType } from '../typings/form-attribute';
import {
    DatePicker,
    Select,
    Modal,
    Button,
    Tag,
    Icon,
    Pagination
} from 'h3-antd-vue';
// 配置项
var option = {
    title: '员工费用报销' 
};
@Component({
    name: 'applicationExpense',
    components: {
        PageNoData: common.components.pc.PageNoData,
        PageLoading: common.components.pc.PageLoading,
        PageLoadFail: common.components.pc.LoadFail,
        ARangePicker: DatePicker.RangePicker,
        locale,
        ASelect: Select,
        ASelectOption: Select.Option,
        StaffSelect: rendererComponents.StaffSelector,
        AModal: Modal,
        AButton: Button,
        ATag: Tag,
        AIcon: Icon,
        APagination: Pagination
    }
})

export default class SongyuReport extends Vue {
    curPage:number = 1;
    pageSize:number = 10;
    totalElements:number = 0;
    isWhitch:boolean = false;
    selectItem: string = '';
    selectOptions: any[] = [];
    searchPatten: string = '员工费用报销';
    searchPattenCode: string = 'test0917';
    searchName: string = '';
    searchTimes: any[] = [moment(moment().startOf('month').format('YYYY-MM-DD'), 'YYYY-MM-DD'), moment(moment().endOf('month').format('YYYY-MM-DD'), 'YYYY-MM-DD')];
    selectNames: Array<any> = [];
    // 接口返回数据
    returnCountDatas: Array<any> = [];
    unDoneDatas: Array<any> = [];
    // 分页选项
    pageSizeOptions: Array<string> = [
        '10',
        '20',
        '50',
        '100'
    ];
    selectOpts = {
        key: "orgRoot",
        selectOrg: false,
        selectUser: true,
        mulpitle: true,
        showModel: true,
        showSelect: true,
        recursive : true,
        placeholder: "点击选择"
    };
    @Model('input',{
        default : () => []
    })
    value !: any
    @Prop({
        default:''
    })
    formula !: string
    @Watch('formula',{
        immediate:true
    })
    onFormulaChange(formula : string){
        let mulpitle = true;
        switch(formula){
            case 'Equal':
            case 'NotEqual':
                mulpitle = false;
                break;
            default:
                mulpitle = true;
                break;
        }
        this.selectOpts = Object.assign({},this.selectOpts,{
            mulpitle
        })
    }
    @Watch('value',{
        immediate:true
    })
    onValueChange(){
        if(Array.isArray(this.value)){
            this.selectNames = this.value.map(x => ({
                name : x.label,
                id : x.value
            }));
        }else{
            this.selectNames = [];
        }
    }
    handleChange(value:any) {
        switch(value){
            case 'test0917':
                this.searchPatten = '员工费用报销';
                this.searchPattenCode = 'test0917';
                this.postAmountStatistic(this.searchPattenCode, this.selectNames, this.searchTimes);
            break;
            case 'payment_approval':
                this.searchPatten = '资金付款审批';
                this.searchPattenCode = 'payment_approval';
                this.postAmountStatistic(this.searchPattenCode, this.selectNames, this.searchTimes);
            break;
        }
    }
    /**
     * 修改分页大小
     */
    pageSizeChange(current: number, pageSize: number) {
        this.curPage = current;
        this.pageSize = pageSize;
    }
    onChangeTimes(){
        this.postAmountStatistic(this.searchPattenCode, this.selectNames, this.searchTimes);
    }
    mounted () {
        this.selectOptions = [{
            name: '员工费用报销',
            index: 1,
            code: 'test0917'
        },{
            name: '资金付款申请',
            index: 2,
            code: 'payment_approval'
        }];
        this.postAmountStatistic(this.searchPattenCode, this.selectNames, this.searchTimes);
    }
    staffSelectChange(values:any[]){
        const vals = values.map(x => ({
            label : x.name,
            value : x.id
        }));
        this.$emit('input',vals);
        this.postAmountStatistic(this.searchPattenCode, vals, this.searchTimes);
    }
    preClick(name, type){
        this.isWhitch = type;
        this.searchName = name;
        this.viewUndoDatas(name, 10, 1);
    }
    hadClick(name, type){
        this.isWhitch = type;
        this.searchName = name;
        this.viewDoneDatas(name, 10, 1);
    }
    // 请求后端接口，获取数量统计表数据
    postAmountStatistic(patten: string, names: Array<any>, times: any){
        let loading:any = this.$message.loading('数据加载中...', 0);
        let type = patten;
        let participantName:any[] = [];
        if(names.length > 0){
            names.forEach((item:any, index:any) => {
                participantName.push(item.label || item.name);
            });
        }
        let startTime = times[0].format('YYYY-MM-DD');
        let finishTime = times[1].format('YYYY-MM-DD');
        let paramData = {
            type: type,
            participantName: participantName,
            startTime: startTime + ' 00:00:01',
            finishTime: finishTime + ' 23:59:59',
        }
        let that = this;
        return axios.post('http://113.12.64.58:88/api/ext/v1/sy/report/getCount', paramData).then((res:any) => {
            if(res && res.errcode === 0){
                that.returnCountDatas = res.data;
                loading();
            }else{
                this.$message.error('查询结果为空');
                loading();
            }

        }).catch((e:any) => {
            that.$message.error(e);
            loading();
        });
    }
    // 数据统计表excel导出
    excelExport(){
        let loadingExport:any = this.$message.loading('数据导出中，请稍等...', 0);
        return axios({
            method: 'post',
            url: 'http://113.12.64.58:88/api/ext/v1/sy/report/exportStatisticsReport',
            data: {
                reportCountBackList: this.returnCountDatas
            },
            headers: {
                'Content-Type': 'application/json'
            },
            responseType: 'blob'
        } as any).then((res:any) => {
            const filename = '数量统计表.xls';
            let blob = new Blob([res], {type: 'application/vnd.ms-excel;charset=utf-8'});
            const elink = document.createElement('a');
            elink.download = filename;
            elink.style.display = 'none';
            elink.href = URL.createObjectURL(blob);
            document.body.appendChild(elink);
            elink.click();
            URL.revokeObjectURL(elink.href); // 释放URL对象
            document.body.removeChild(elink);
            loadingExport();
            this.$message.success('导出成功！', 1);
            // loading();
        }).catch(err => {
            loadingExport();
            this.$message.error(err);
        });
    }
    // 分页器页数改变
    pageChange(page: number, size: number){
        this.curPage = page;
        if(this.isWhitch){
            this.viewDoneDatas(this.searchName, size, page);
        }else{
            this.viewUndoDatas(this.searchName, size, page);
        }
    }
    // 查询代办详细信息接口请求
    viewUndoDatas(name: string, pagesize: number, pageno: number){
        let loading1:any = this.$message.loading('数据加载中...', 0);
        let type = this.searchPattenCode;
        let startTime = this.searchTimes[0].format('YYYY-MM-DD');
        let finishTime = this.searchTimes[1].format('YYYY-MM-DD');
        let participantName = name;
        let pageSize = pagesize;
        let pageNo = pageno;
        let paramData = {
            type: type,
            startTime: startTime + ' 00:00:01',
            finishTime: finishTime + ' 23:59:59',
            participantName: participantName,
            pageSize: pageSize,
            pageNo: pageNo
        }
        return axios.post('http://113.12.64.58:88/api/ext/v1/sy/report/getWorkItem', paramData).then((res:any) => {
            if(res && res.errcode === 0){
                if(res.data.list && res.data.list.length > 0){
                    loading1();
                    this.unDoneDatas = res.data;
                    this.totalElements = res.data.total;
                    this.curPage = res.data.pageNum;
                    this.pageSize = res.data.pageSize
                }else{
                    loading1();
                    this.$message.error('查询结果为空');
                    this.unDoneDatas = res.data;
                    this.totalElements = res.data.total;
                    this.curPage = res.data.pageNum;
                    this.pageSize = res.data.pageSize
                }
            }else{
                loading1();
                this.$message.error('查询结果为空');
            }
        }).catch(e => {
            loading1();
            this.$message.error(e);
        });
    }
    // 查询已办详细信息接口请求
    viewDoneDatas(name: string, pagesize: number, pageno: number){
        let loading2:any = this.$message.loading('数据加载中...', 0);
        let type = this.searchPattenCode;
        let startTime = this.searchTimes[0].format('YYYY-MM-DD');
        let finishTime = this.searchTimes[1].format('YYYY-MM-DD');
        let participantName = name;
        let pageSize = pagesize;
        let pageNo = pageno;
        let paramData = {
            type: type,
            startTime: startTime + ' 00:00:01',
            finishTime: finishTime + ' 23:59:59',
            participantName: participantName,
            pageSize: pageSize,
            pageNo: pageNo
        }
        return axios.post('http://113.12.64.58:88/api/ext/v1/sy/report/getWorkItemFinished', paramData).then((res:any) => {
            if(res && res.errcode === 0){
                if(res.data.list && res.data.list.length > 0){
                    loading2();
                    this.unDoneDatas = res.data;
                    this.totalElements = res.data.total;
                    this.curPage = res.data.pageNum;
                    this.pageSize = res.data.pageSize
                }else{
                    loading2();
                    this.$message.error('查询结果为空');
                    this.unDoneDatas = res.data;
                    this.totalElements = res.data.total;
                    this.curPage = res.data.pageNum;
                    this.pageSize = res.data.pageSize
                }
            }else{
                loading2();
                this.$message.error('查询结果为空');
            }
        }).catch(e => {
            loading2();
            this.$message.error(e);
        });
    }
    // 毫秒转天时分秒
    secondsToHours(inputValue: any){
        let days = parseInt(inputValue / (1000 * 60 * 60 * 24) as any);
        let hours = parseInt((inputValue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60) as any);
        let minutes = parseInt((inputValue % (1000 * 60 * 60)) / (1000 * 60) as any);
        let seconds = parseInt((inputValue % (1000 * 60)) / 1000 as any);
        if(days === 0 && hours === 0 && minutes === 0){
            return seconds + "秒";
        }else if(days === 0 && hours === 0){
            return minutes + "分钟" + seconds + "秒";
        }else if(days === 0){
            return hours + "小时" + minutes + "分钟" + seconds + "秒";
        }else{
            return days + "天" + hours + "小时" + minutes + "分钟" + seconds + "秒";
        }
    }
}

</script>

<style scoped lang="less">
// @import "../style/index.less";
.application-box{
    width: 100%;
    height: 100vh;
    background: url('../assets/report-bg.jpeg') no-repeat center center;
    .search-area{
        width: 100%;
        height: 14vh;
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;
        padding-top: 15px;
        .search-patten{
            width: 25%;
            background-color: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
            .search-title{
                width: 80%;
                display: flex;
                flex-direction: row;
                justify-content:flex-start;
                padding-left: 18px;
                .search-icon{
                    display: block;
                    width: 4px;
                    height: 20px;
                    flex: 0 0 4px;
                    background: linear-gradient(180deg, #25b6ff, #107fff);
                    border-radius: 3px;
                    margin-left: 4px;
                    margin-right: 8px;
                }
                .search-tip{
                    color: rgba(255, 255, 58, 1);
                }
            }
            .search-option{
                width: 80%;
                margin: 0 auto;
            }
        }
        .search-staff{
            width: 40%;
            background-color: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
            .search-title{
                width: 80%;
                display: flex;
                flex-direction: row;
                justify-content:flex-start;
                padding-left: 30px;
                .search-icon{
                    display: block;
                    width: 4px;
                    height: 20px;
                    flex: 0 0 4px;
                    background: linear-gradient(180deg, #25b6ff, #107fff);
                    border-radius: 3px;
                    margin-left: 4px;
                    margin-right: 8px;
                }
                .search-tip{
                    color: rgba(255, 255, 58, 1);
                }
            }
            .search-name{
                width: 80%;
                margin: 0 auto;
                background: white;
                outline: none;
                border-radius: 4px;
            }
        }
        .search-time{
            width: 25%;
            background-color: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
            .search-title{
                width: 80%;
                display: flex;
                flex-direction: row;
                justify-content:flex-start;
                padding-left: 30px;
                .search-icon{
                    display: block;
                    width: 4px;
                    height: 20px;
                    flex: 0 0 4px;
                    background: linear-gradient(180deg, #25b6ff, #107fff);
                    border-radius: 3px;
                    margin-left: 4px;
                    margin-right: 8px;
                }
                .search-tip{
                    color: rgba(255, 255, 58, 1);
                }
            }
            .time-picker{
                width: 80%;
                margin: 0 auto;
            }
        }
    }
    .data-table{
        width: 95%;
        height: 29vh;
        background: rgba(0, 0, 0, 0.3);
        margin: 15px auto 0;
        border-radius: 8px;
        overflow: hidden;
        .table-describe{
            height: 20px;
            line-height: 20px;
            margin: 10px 30px 10px 30px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            .search-left{
                width: 200px;
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                .search-icon{
                    display: block;
                    width: 4px;
                    height: 20px;
                    flex: 0 0 4px;
                    background: linear-gradient(180deg, #25b6ff, #107fff);
                    border-radius: 3px;
                    margin-left: 4px;
                    margin-right: 8px;
                    // margin-top: 6px;
                }
                .search-tip{
                    color: rgba(255, 255, 58, 1);
                }
            }
        }
        .table-first{
            width: 94%;
            height: 20vh;
            color: white;
            margin: 0 auto;
            border-collapse: collapse;
            border-color: white;
            text-align: center;
            position: relative;
            thead,tbody tr{
                display: table;
                width: 100%;
                table-layout: fixed;
            }
            tbody{
                display: block;
                max-height: 18vh;
                overflow-y: auto;
                overflow-x: hidden;
                
            }
            tbody::-webkit-scrollbar{
                width: 0 !important;
            }
        }
    }
    .data-table2{
        width: 95%;
        height: 38vh;
        background: rgba(0, 0, 0, 0.3);
        margin: 15px auto 0;
        border-radius: 8px;
        overflow: hidden;
        .table-describe{
            height: 20px;
            line-height: 20px;
            margin: 10px 30px 10px 30px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            .search-left{
                width: 200px;
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                .search-icon{
                    display: block;
                    width: 4px;
                    height: 20px;
                    flex: 0 0 4px;
                    background: linear-gradient(180deg, #25b6ff, #107fff);
                    border-radius: 3px;
                    margin-left: 4px;
                    margin-right: 8px;
                    // margin-top: 6px;
                }
                .search-tip{
                    color: rgba(255, 255, 58, 1);
                }
            }
        }
        .table-second{
            width: 94%;
            height: 23vh;
            color: white;
            margin: 0 auto;
            border-collapse: collapse;
            border-color: white;
            text-align: center;
            position: relative;
            thead,tbody tr{
                display: table;
                width: 100%;
                table-layout: fixed;
            }
            tbody{
                display: block;
                max-height: 19vh;
                overflow-y: auto;
                overflow-x: hidden;
            }
            tbody::-webkit-scrollbar{
                width: 0 !important;
            }
        }
        .pagination{
            float: right;
            margin: 10px 35px 0 0;
            .ant-pagination{
                color: white;
                margin-top: 6px;
                .ant-pagination-prev::after{
                    content: '<'
                }
            }
        }
    }
}
</style>
```
30、entries\admin\src\components\apps\settings\permission-group-form.vue
```
// ygc-----start-----修复产品admin端应用设置-》管理权限=》权限设置最后一项被底部取消保存遮挡问题
  margin-bottom: 75px;
// ygc-----end-----修复产品admin端应用设置-》管理权限=》权限设置最后一项被底部取消保存遮挡问题
```
