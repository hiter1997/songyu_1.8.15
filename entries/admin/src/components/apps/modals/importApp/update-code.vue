<template>
  <div class="update-code">
    <div class="table-box">
      <div class="table-box-tip">
        <i class="icon aufontAll h-icon-all-check-circle exclamation-circle"></i>
        <span class="file-status-txt">检测到编码重名，修改后导入将生成新的应用或业务模型</span>
      </div>

      <div class="code-table" v-if="type.appCodeRepeat && list.appCodeList.length > 0">
        <div class="code-table-head">
          <span>应用</span>
          <span>原编码</span>
          <span>新编码</span>
        </div>

        <div 
          class="code-table-body"
          v-for="(item, index) in list.appCodeList"
          :key="index"
        >
          <span :title="item.appName">{{ item.appName }}</span>
          <span :title="item.appCode">{{ item.appCode }}</span>
          <span>
            <a-input placeholder="请输入" v-model="item.newCode" size="small" />
          </span>
        </div>
      </div>

      <div class="code-table" v-if="type.modelCodeRepeat && list.modelCodeList.length > 0">
        <div class="code-table-head">
          <span>模型</span>
          <span>原编码</span>
          <span>新编码</span>
        </div>

        <div
          class="code-table-body"
          v-for="(item, index) in list.modelCodeList"
          :key="index"
        >
          <span :title="item.modelName">{{ item.modelName }}</span>
          <span :title="item.modelCode">{{ item.modelCode }}</span>
          <span>
            <a-input placeholder="请输入" v-model="item.newCode" size="small" />
          </span>
        </div>
      </div>

      <div class="code-table" v-if="type.modelCodeRepeat && list.subCodeList.length > 0">
        <div class="code-table-head">
          <span>子表编码</span>
          <span>原编码</span>
          <span>新编码</span>
        </div>

        <div
          class="code-table-body"
          v-for="(item, index) in list.subCodeList"
          :key="index"
        >
          <span :title="item.modelName">{{ item.modelName }}</span>
          <span :title="item.modelCode">{{ item.modelCode }}</span>
          <span>
            <a-input placeholder="请输入" v-model="item.newCode" size="small" />
          </span>
        </div>
      </div>
    </div>
  </div> 
</template>
<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { State, Action, namespace } from 'vuex-class';

import { Input } from '@h3/antd-vue';

@Component({
  name:"update-code",
  components: {
    AInput: Input
  }
})
export default class UpdateCode extends Vue {

  @Prop() type !: any;

  /*
  {
    appCodeList: [],
    modelCodeList: []
  }
  */ 
  @Prop() list !: any;


  getCodeList() {
    let existEmptyAppcode:boolean = false;
    let existEmptyModelcode:boolean = false;
    let existEmptySubCode:boolean = false;
    let existValidAppcode:boolean = false;
    let existValidModelcode:boolean = false;
    let existValidSubCode:boolean = false;
    if (this.list.appCodeList.length > 0) {
      existEmptyAppcode = this.list.appCodeList.some((item:any) => !item.newCode);
      existValidAppcode = this.list.appCodeList.some((item:any) => !/^[a-zA-Z][a-zA-Z0-9_]{0,25}$/.test(item.newCode));
    }

    if (this.list.modelCodeList.length > 0) {
      existEmptyModelcode = this.list.modelCodeList.some((item:any) => !item.newCode);
      existValidModelcode = this.list.modelCodeList.some((item:any) => !/^[a-zA-Z][a-zA-Z0-9_]{0,25}$/.test(item.newCode));
    }

    if (this.list.subCodeList.length > 0) {
      existEmptySubCode = this.list.subCodeList.some((item:any) => !item.newCode);
      existValidSubCode = this.list.subCodeList.some((item:any) => !/^[a-zA-Z][a-zA-Z0-9_]{0,25}$/.test(item.newCode));
    }

    if (existEmptyModelcode || existEmptyAppcode || existEmptySubCode) {
      this.$message.error('新编码不能为空')
      return null;
    }

    if (existValidAppcode || existValidModelcode || existValidSubCode) {
      this.$message.error('编码格式必须以字母开头不超过26个字符，仅支持字母、数字、下划线');
      return null;
    }

    return this.list;
  }



}
</script>
<style lang="less" scoped>
  .update-code {
    .table-box {
      &-tip {
        & > .exclamation-circle {
          color: #FAAD14;
        }
        & > .file-status-txt {
          padding-left: 16px;
          font-weight: bold;
        }
      }
      .code-table {
        padding-left: 32px;
        padding-right: 24px;
        margin-top: 24px;
        margin-bottom: 32px;
        &-head, &-body {
          display: flex;
          justify-content: space-between;
          align-items: center;
          & > span {
            display: inline-block;
            width: 30%;
            margin-right: 1.5%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 20px;
            &:last-of-type {
              margin-right: 0;
            }
          }
        }
        &-body {
          margin-top: 8px;
          margin-bottom: 16px;
        }
      }
    }
  }
</style>