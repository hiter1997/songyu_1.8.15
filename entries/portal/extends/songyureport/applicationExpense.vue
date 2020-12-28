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