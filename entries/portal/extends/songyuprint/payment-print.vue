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