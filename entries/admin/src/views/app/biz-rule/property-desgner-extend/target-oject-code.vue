<template>
  <div class="target-oject-code">
    <a-select
      style="width: 100%"
      @change="selectChange"
      v-model="theVale"
      @focus="getFocus"
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
  name: 'target-oject-code',
})

export default class TargetOjectCode extends Mixins(PropertyComponent) {
  @Prop() dataItems!:any;
  @Inject()
  getController!: () => forms.FormGroup

  get controller(){
    return this.getController();
  }

  triggerObjLists:any = [];

  theVale = ''
  schemaCode = '';

  created() {
    this.onValueChange(this.value);
    const val = this.controller.children.targetSchema;
    if(val && val.value) {
      this.schemaCode = val.value.schemaCode;
    }
    this.controller.children.targetSchema.propertyChange.subscribe((change:any) =>{
      this.schemaCode =  change.value.schemaCode;
    })
    this.loadOptions();
  }
  optionsMap:any = {};
  loadOptions() {
    const triggerObjectCode:string = this.controller.children.triggerObjectCode.value;
    const val = this.controller.children.targetSchema;
    if(val && val.value && val.value.schemaCode) {
      this.schemaCode = val.value.schemaCode;
    } else {
      return;
    }
    const schemaCode =  this.schemaCode;
    const params = {
      schemaCode: schemaCode
    };

    if (this.optionsMap[triggerObjectCode + schemaCode]) {
      this.triggerObjLists = [...this.optionsMap[triggerObjectCode + schemaCode]];
      return;
    }
   
    
   
    AppsApi.getBizmodeltitle(params).then((res:any) => {
      if (res.errcode === 0) {
        const main = {
          code: this.schemaCode,
          name: res.data
        }
        if (triggerObjectCode && triggerObjectCode.indexOf('.') > -1) {
          this.triggerObjLists = [main];
          this.optionsMap[triggerObjectCode + schemaCode] = [...this.triggerObjLists];
          return;
        }
        AppsApi.getDataItemList({ schemaCode: schemaCode }).then(item => {
          if (item.errcode === 0) {
            const sheetData =  item.data.filter(dataItem => dataItem.propertyType === 8).map(i => {
              return {code:`${schemaCode}.${i.code}`, name: i.name}
            });
            this.triggerObjLists = [main, ...sheetData];
            this.optionsMap[triggerObjectCode + schemaCode] = [...this.triggerObjLists];
          };
        })
      }
    });
  }

  getFocus() {
    this.loadOptions();
  }

  selectChange(val) {
    this.emitChange(val);
    this.cleanVal();
  }

  cleanVal() {
    if(this.controller.children.dataCondition){
      this.controller.children.dataCondition.value = {};
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
  }

  @Watch('value') 
  onValueChange(val) {
    this.theVale = val;
    this.emitChange(val);
    if (!val) {
      this.triggerObjLists = [];
    } else {
      this.loadOptions();
    }
  }
}
</script>

<style lang="less" scoped>
    
</style>

