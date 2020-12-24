<template>
  <div class="trigger-schema-code">
    <a-select
      style="width: 100%"
      @change="selectChange"
      v-model="theVale"
    >
      <a-select-option
        v-for="item in triggerObjLists"
        :key="item.code"
        :value="item.code"
      >{{ `${item.name}[${item.code}]` }}</a-select-option>
    </a-select>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Mixins, Watch, Inject } from 'vue-property-decorator';
import { PropertyComponent } from '@h3/designer-core/property-panel';
import AppsApi from '@/apis/apps';
import * as forms from 'h3-forms'

@Component({
  name: 'trigger-schema-code',
})

export default class TriggerSchemaCode extends Mixins(PropertyComponent) {
  @Prop() dataItems!:any;
  @Inject()
  getController!: () => forms.FormGroup

  get controller(){
    return this.getController();
  }


  triggerObjLists:any = [];

  theVale = ''

  get schemaCode() {
    return this.$route.params.bizSchemaCode;
  }

  created() {
    this.onValueChange(this.value);
    const params = {
      schemaCode: this.schemaCode
    };
    AppsApi.getBizmodeltitle(params).then((res:any) => {
      if (res.errcode === 0) {
        const main = {
          code: this.schemaCode,
          name: res.data
        }
        const subSchemaLists = this.dataItems.filter(items => items.propertyType === 8).map(item => {
          return {code:`${this.schemaCode}.${item.code}`, name: item.name}
        });
        this.triggerObjLists = [main, ...subSchemaLists];
      }
    });
  }

  selectChange(val) {
    this.emitChange(val);
    this.cleanVal();
  }

  cleanVal() {
    if(this.controller.children.dataCondition){
      this.controller.children.dataCondition.value = {};
    }
    
    if (this.controller.children.childTriggerConditionType) {
      this.controller.children.childTriggerConditionType.value = '';
    }
    
    if (this.controller.children.createDataAction) {
      this.controller.children.createDataAction.value = {};
    }

    if (this.controller.children.dataActions) {
      this.controller.children.dataActions.value = []
    }
    if(this.controller.children.filterCondition){
      this.controller.children.filterCondition.value = {};
    }

    if(this.controller.children.targetObjectCode){
      this.controller.children.targetObjectCode.value = '';
    }
    
    if(this.controller.children.judgeCondition){
      this.controller.children.judgeCondition.value = {};
    }

    if(this.controller.children.verifyConditions){
      this.controller.children.verifyConditions.value = {};
    }
  }

  @Watch('value') 
  onValueChange(val) {
    this.theVale = val;
    // if (val) {
    //   if (val.indexOf('.') > -1) {
    //     this.controller.children.childTriggerConditionType.display = true;
    //   } else {
    //      this.controller.children.childTriggerConditionType.display = false;
    //   }
    // }
  }
}
</script>

<style lang="less" scoped>
    
</style>

