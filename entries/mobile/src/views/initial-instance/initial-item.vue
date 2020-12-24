<template>
  <initial-item/>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import flowCenter from '@cloudpivot/flow-center/mobile';

import { State } from 'vuex-class';

import * as platform from '@cloudpivot/platform';

@Component({
  name: 'initial-items',
  components: {
    InitialItem: flowCenter.components.InitialItem
  }
})
export default class InitialItems extends Vue {
  @State('appName') appName!: any;

  appCode:string = '';

  created() {
    this.appCode = this.$route.params.appCode;
    platform.service.setTitle(this.appName);
  }
}
</script>

<style lang="less" scoped>
</style>
