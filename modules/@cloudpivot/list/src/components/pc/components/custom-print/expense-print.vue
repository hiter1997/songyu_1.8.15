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