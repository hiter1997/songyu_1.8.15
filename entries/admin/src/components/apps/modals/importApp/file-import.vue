<template>
  <div class="file-import">
    <div class="import-progress">
      <a-progress
        type="circle"
        :percent="percent"
        :width="100"
        :status="progressStatus"
        :strokeColor="strokeColor"
      ></a-progress>

      <div class="note">
        {{ importStatusTxt }}
      </div>

      <div class="import-hint">{{ importHint }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  Component, Prop, Vue, Watch
} from 'vue-property-decorator';

import { Progress } from '@h3/antd-vue';

import * as FileValidateNS from '@/typings/app-error';

import AppsApi from '@/apis/apps';

@Component({
  name: 'FileImport',
  components: {
    AProgress: Progress
  }
})

export default class FileImport extends Vue {
  
  @Prop() fileName !: string;

  @Prop() dmCodeList !: any[];

  @Prop() subCodeList !: any[];

  @Prop() appCode !: string;

  @Prop({ default: false }) override !: boolean;

  
  percent:number = 0;

  importStatusTxt:string = '导入中' as string;

  importStatus:string = 'active'; // 导入状态 process success error

  importHint:string = '导入数据过程中请不要关闭页面，避免导入错误'; // 导入提醒

  progressStatus:string = 'active'; // 导入状态

  simulateInterval:any = null;

  isImportEnd:boolean = false;

  get strokeColor(){
    const { progressStatus } = this;
    if (progressStatus !== 'exception') {
      return '#17BC94'
    } 
    return '#F4454E'
  }

  mounted(){
    this.importStart();
  }


  async importStart(){
    this.simulateImport();
    const { fileName, dmCodeList, appCode, override, subCodeList } = this;
    const params: Apps.AppItem.CheckAppParams = {
      appCode,
      fileName,
      override,
      dmCodeList,
      subCodeList 
      }
    const res:any = await AppsApi.importApp(params);
    this.isImportEnd = true;
    this.$emit('importEnd');
    const { errcode, errmsg } = res;
      this.percent = 100;
      if (errcode === 0) {
        const { data } = res;
        if (data) {
          this.percent = 100;
          this.progressStatus = 'success';
          this.importStatusTxt = '导入成功';
          this.importHint = '';
          this.$emit('succeed')
        } else {
          this.percent = 75;
          this.progressStatus = 'exception';
          this.importStatusTxt = '导入失败';
          this.importHint = errmsg || '网络异常导入失败，重新导入';
        }
      } else {
        this.percent = 75;
        this.progressStatus = 'exception';
        this.importStatusTxt = '导入失败';
        this.importHint = errmsg || '网络异常导入失败，重新导入';
      }
      // 这种报错不宜展示给用户
      this.importHint = errcode === 999999 ? '后台导入SQL执行出错，请重新导入！': this.importHint;
  }


  /**
   * 模拟导入处理进度
   */
  simulateImport() {
    let percent = 1;
    this.simulateInterval = setInterval(() => {
      if (!this.isImportEnd) {
        if (percent <= 90) {
          percent += this.random(5);
          this.percent = percent;
        }
      } else {
        clearInterval(this.simulateInterval);
      }
    }, 1500);
  }


  /**
   * 产生随机整数
  */
  random(num: number) {
    return Math.ceil(Math.random() * 5);
  }

  @Watch('importStatus')
  onImportStatusChange(v:string) {
    switch (v) {
      case FileValidateNS.ImportStatus.Importing:
        this.importStatusTxt = '导入中';
        this.importHint = '导入数据过程中请不要关闭页面，避免导入错误';
        break;
      case FileValidateNS.ImportStatus.ImportSuccess:
        this.importStatusTxt = '导入成功';
        this.importHint = '';
        break;
      case FileValidateNS.ImportStatus.ImportError:
        this.importStatusTxt = '导入失败';
        this.importHint = '网络异常导入失败，重新导入';
        this.progressStatus = 'exception';
        break;
      default: break;
    }
  }
}
</script>

<style lang="less" scoped>
  .file-import {
    & .import-progress {
      margin-top: 36px;
      text-align: center;
      & .note {
        margin-top: 12px;
        color: rgba(0, 0, 0, .85);
        font-size: 16px;
      }
      & .import-hint {
        margin-top: 8px;
        color: rgba(0, 0, 0, .65);
        font-size: 14px;
      }
    }
  }
</style>
