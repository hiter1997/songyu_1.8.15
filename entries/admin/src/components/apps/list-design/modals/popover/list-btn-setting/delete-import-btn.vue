<template>
  <div class="popover-wrap">
    <a-row class="row">
      <a-col :span="6">
        <label class="title">{{ $t('languages.Apps.DisplayName') }}</label>
      </a-col>
      <a-col :span="rightWidth">
        <a-input
          v-if="isChinese"
          maxlength="50"
          v-model="backData.name"
          :class="{'input-error':!backData.name.trim()}"
        />
        <a-input
          v-else
          maxlength="50"
          v-model="backData.name_i18n[$i18n.locale]"
          :class="{'input-error':!backData.name_i18n[$i18n.locale].trim()}"
        />
        <div class="empty-tip" v-if="isChinese && !backData.name.trim()">{{ $t('languages.Apps.DisplayNameRequire') }}</div>
        <div class="empty-tip" v-if="!isChinese && !backData.name_i18n[$i18n.locale].trim() ">{{ $t('languages.Apps.DisplayNameRequire') }}</div>
      </a-col>
    </a-row>
    <div class="btn-group btn-group-fixed clearfix">
      <a-button
        class="btn"
        type="primary"
        size="small"
        @click="close"
      >{{ $t('languages.Apps.Ok') }}</a-button>
      <a-button
        class="btn"
        size="small"
        @click="concel"
      >{{ $t('languages.Apps.Cancel') }}</a-button>
    </div>
    <div>
    </div>
  </div>
</template>
<script lang="ts">
import {
  Component, Vue, Prop, Watch, Emit
} from 'vue-property-decorator';
import { DateType, WidthSettingType } from '../../control-modals-map';
@Component({
  name: 'AddBtn',
  components: {
  }
})
export default class AddBtn extends Vue {
  @Prop() modalData!:any;

  // 判断当前是否是中文版本
  get isChinese() {
    return this.$i18n.locale === 'zh';
  }

  leftWidth:number = 6;

  rightWidth:number = 18;

  visible: boolean = true;

  DateType = DateType;

  WidthSettingType = WidthSettingType;

  backData = {
    name: '',
    name_i18n:{}
  }

  close() {
    if ( this.isChinese && !this.backData.name.trim()) return;
    else if ( !this.isChinese && !this.backData.name_i18n[this.$i18n.locale].trim() ) return;
    this.$emit('backData', this.backData);
  }

  concel() {
    this.$emit('closeModal', this.backData);
  }

  created() {
    if (this.modalData) {
      this.backData = JSON.parse(JSON.stringify(this.modalData))
    }
  }
}
</script>
<style lang="less" scoped>
  .popover-wrap{
    padding: 0 6px;
    width: 280px;
    .row{
      margin-bottom: 16px;
      .ant-col-6{
        label{
          line-height: 32px;
          color: rgba(0, 0, 0, .65);
        }
      }
      .ant-col-18{
        .l-h{
          line-height: 32px;
        }
      }
      .select{
        width: 100%;
      }
    }
    .btn-group {
      .btn{
        &:last-child{
          margin-right: 8px;
        }
        float: right;
      }
      .left{
        margin-right: 16px;
      }
    }
    .empty-tip{
      color: #f5222d;
      font-size: 12px;
    }
    input.input-error{
      border-color:#f5222d;
    }
  };
</style>
