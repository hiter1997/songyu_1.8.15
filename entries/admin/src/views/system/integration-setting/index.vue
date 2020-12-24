<template>
  <div class="integration-setting">
    <div class="integration-setting__tabs">
      <a-tabs :defaultActiveKey="integrationDefaultActiveKey" @change="change">
        <a-tab-pane :tab="'文件储存'" key="1">
          <div class="tabs__wrap">
            <file-storage></file-storage>
          </div>
        </a-tab-pane>

        <a-tab-pane :tab="'附件预览'" key="2">
          <div class="tabs__wrap">
            <annex-preview></annex-preview>
          </div>
        </a-tab-pane>
      </a-tabs>
      
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import {State, namespace} from 'vuex-class';

import annexPreview from './annex-preview.vue';
import fileStorage from './file-storage.vue';

const UserModule = namespace('System/User');

@Component({
  name: "integration-setting",
  components: {
    annexPreview,
    fileStorage
  }
  })
export default class IntegrationSetting extends Vue {
  @UserModule.State('isAdmin') isAdmin!: boolean;
  
  integrationDefaultActiveKey: string = '1';
  activeKey: string = '1';


  created() {

    const integrationDefaultActiveKey: any = localStorage.getItem('integrationDefaultActiveKey');
    if (integrationDefaultActiveKey) {
      this.integrationDefaultActiveKey = integrationDefaultActiveKey;
      this.activeKey = integrationDefaultActiveKey
    }
  }

  change(activeKey) {
    localStorage.setItem('integrationDefaultActiveKey', activeKey);

    this.activeKey = activeKey;
  }

  destroyed() {
    localStorage.removeItem('integrationDefaultActiveKey');
  }
}
</script>
<style lang="less" scoped>
.integration-setting {
  text-align: left;
  &__tabs {
    /deep/.ant-tabs-nav {
      margin: 0 24px;
    }
    .tabs__wrap{
      margin:0 24px;
    }
  }
  /deep/.ant-table-body, /deep/.ant-table-header {
    &::-webkit-scrollbar {
      width: 0;
    }
  }
}
</style>

