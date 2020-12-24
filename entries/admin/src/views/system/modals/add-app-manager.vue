<template>
  <a-modal
    :title="modalTitle"
    :visible="visible"
    :width="544"
    :cancelText="$t('languages.Apps.Cancel')"
    :okText="$t('languages.Apps.Ok')"
    @ok="addManager"
    @cancel="closeModel"
    :maskClosable="false"
    wrapClassName="add-app-manager-model"
    :keyboard="false"
  >
    <div class="add-app-manager">
      <a-row class="add-app-manager__item">
        <a-col :span = "layout.left" class="add-app-manager__left">
          <span class="label-required">管理员:</span>
        </a-col>
        <a-col :span = "layout.right" class="add-app-manager__right">
          <template v-if="id">
            <span v-for="(u,idx) in users" :key="idx">{{ u.name }}</span>
          </template>
          <staff-selector
            v-else
            v-model="users"
            :options="taffSelectorOpts"
            @ok="addUsers"
            @change="selectChange"
          >
          </staff-selector>
          <!-- <div v-if="validate.users">
            <span class="error">管理员不能为空</span>
          </div> -->
        </a-col>
      </a-row>

      <a-row class="add-app-manager__item item-title">
        <a-col :span = "layout.left" class="add-app-manager__left">
          <span>应用范围:</span>
        </a-col>
        <a-col :span = "layout.right" class="add-app-manager__right">
          
        </a-col>
      </a-row>

      <a-row class="add-app-manager__item">
        <app-package v-model="selectData" :id="id" :operateType="operateType"></app-package>
      </a-row>

      <a-row class="add-data-manager__item">
        <a-col :span = "layout.left" class="add-app-manager__left">
          <span>组织管理范围:</span>
        </a-col>
        <a-col :span = "layout.right" class="add-data-manager__right">
          <staff-selector
            :options="stuffOrOrgSelectorOpts"
            :params="staffParams"
            :keepDeptIds="keepDeptIds"
            convertKey="unitId"
            v-model="departments"
            @ok="addDepartments"
          >
          </staff-selector>
        </a-col>
      </a-row>

    </div>
  </a-modal>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit, Watch } from 'vue-property-decorator';
import { State, Action, Mutation, namespace } from 'vuex-class';
import { pattern, nameValidator } from '@/common/utils';
import systemApi from '@/apis/system/system-manager.api';
import { formApi } from "@cloudpivot/api";

import StaffSelector from "@cloudpivot/form/src/common/components/form-staff-selector/pc/staff-selector.vue";

// import AppsSelect from '../manager-setting/apps-select.vue';
import AppPackage from '../manager-setting/app-package.vue';

const UserModule = namespace('System/User');

@Component({
  name: 'add-app-manager',
  components: {
    StaffSelector,
    AppPackage
  }
})

export default class AddAppManager extends Vue {
  @Prop() visible!: boolean;
  @Prop() id!: string;
  @UserModule.State('isOnlyAppAdmin') isOnlyAppAdmin!: boolean;
  @UserModule.State('isAdmin') isAdmin!: boolean;

  selectData:Array<string> = []; // 运用app

  copySelectData:Array<string> =[];


  layout = {
    left: 6,
    right: 18
  }

  taffSelectorOpts = {
    selectOrg: false,
    selectUser: true,
    showModel: true,
    mulpitle: false,
    showSelect: true,
    placeholder: '请选择',
  }

    // 选人与选组织
  stuffOrOrgSelectorOpts = {
    selectOrg: true,
    selectUser: false,
    showModel: true,
    mulpitle: true,
    showSelect: true,
    placeholder: '请选择'
  }

  departments = []; // 组织或角色
  keepDeptIds: string = '';

  users: any = [];
  userId: string = '';

  treeData = [];

  validate = {
    users: false,
    apps: false
  }

  operateType: string = '';

  get curCorpId(){
    return `${this.users[0] ? (this.users[0] as any).corpId : ''}`;
  }

  get staffParams() {
    let params: any = { filterType: 'related' };
    
    // @ts-ignore
    let { users, curCorpId } = this;
    if (users.length > 0) {
      // @ts-ignore
      params.corpId = curCorpId
    }

    if (this.isOnlyAppAdmin) {
      params.filterType = 'admin';
      const selectUserIds: any = [];

      for (const item of users) {
        selectUserIds.push(item.id);
      }

      params.selectUserIds = selectUserIds.join(',');
    }
    
    return params
  }

  get modalTitle(){
    if (this.id) {
      return '编辑子管理员'; 
    } else {
      return '添加子管理员'; 
    }
  }

  created() {
    if (!this.id) {
      this.operateType = 'add';
    }
  }

  addDepartments(val:any) {
    this.departments = val;
  }

  clearChoose() {
    this.users = [];
    this.selectData = [];
  }

  addManager() {
    
    if (this.users.length === 0) {
      this.$message.info('管理员不能为空');
      return;
    }

    const notAuthDepartments: any[] = [];
    const departments: any[] = [];

    for(let i = 0, len = this.departments.length; i < len; i++) {

      const item: any = this.departments[i];

      if (!this.keepDeptIds.includes(item.unitId)) {
        departments.push(item);
      } else {
        notAuthDepartments.push(item);
      }
    };

    const obj: any = {
      users: this.users,
      appPackages: this.selectData,
      departments: departments,
      notAuthDepartments: notAuthDepartments
    };

    this.$emit('submit', obj);
    this.clearChoose();
  }

  closeModel() {
    this.operateType = '';
    this.clearChoose();
    this.$emit('cancel');
  }

  selectChange() {
    if (this.users.length) {
      this.validate.users = false;
    } else {
      this.validate.users = true;
    }
  }

  addUsers(val:any) {
    this.users = val;

    this.departments = [];
  }

  @Watch('id', {
    immediate: true
  })
  async onIdChange() {
    await this.getDetail();
  }

  async getDetail() {
    const vm: any = this;
    if (!vm.id) {
      vm.users = [];
      return;
    }
    const params: any = {
      id: vm.id,
      editShow: true
    };
    const res: any = await systemApi.getManagerInfo(params);
    const data: any = res.data;

    if (data) {
        vm.userId = data.userId;
        vm.selectData = this.getAppPackage(data.appPackages);
        vm.copySelectData = JSON.parse(JSON.stringify(vm.selectData));
        //   .map((res:any) => {
        //   return code;
        // });
        vm.departments = data.departments;
        vm.users = [{
          id: data.userId,
          name: data.name,
          imgUrl: data.imgUrl,
          corpId: data.corpId
        }];

        vm.operateType = 'edit';

        this.setKeepDeptIds();
      }
  }

  async setKeepDeptIds(){
    let sType:string = '';
    const { departments, userId } = this;
    
    if (!departments.length) return;

    const types:number[] = departments.map((i:any) => i.unitType) as number[]; // 1 部门  3 人员
    const isAllDept:boolean = types.every((i:number) => i === 1 );
    const isAllStaff:boolean = types.every((i:number) => i === 3 );
    
    if (isAllDept && !isAllStaff) { // 全部部门
      sType = 'DEPT';
    } else if (!isAllDept && isAllStaff) { // 全部人员
      sType = 'USER';
    } else if (!isAllDept && !isAllStaff) { // 二者均有
      sType = 'DEPT_USER';
    }

    const targetIds:string[] = departments.map((staff:any) => {
      if (staff.unitType === 1) return staff.unitId;
    }).filter((i:any) => !!i);


    const params: any = { targetIds: targetIds.join(','), selectUserId: userId};

    const res:any = await systemApi.checkEditPerm(params);
    const { data } = res;

    this.keepDeptIds = data.map((i:any) => {
        if(!i.op) { return i.targetId; }
    }).filter((i:any) => !!i);

  }

  getAppPackage(data) {
    const result: any = [];
    data.map((item, index) => {
      result.push({
        ...item,
        isDataManage: item.operatable,
        index: index
      });
    });

    return result;
  }
  
}
</script>
<style lang="less" scoped>
.add-app-manager{
  &__dataItem {
    margin-top: 16px;
  }

  .add-app-manager__left {
    height: 32px;
    line-height: 32px;
    font-family:PingFangSC-Medium,PingFang SC;
    font-weight:500;
    color:rgba(0,0,0,0.85);
  }

  &__item{
    margin-bottom: 20px;
    
    .add-app-manager__right {
      .add-app-manager__select{
        width: 100%;
      }
      &>span{
        height: 32px;
        line-height: 32px;
      }
    }

    &.item-title {
      margin-bottom: 0;
    }
  }
}
</style>

<style lang="less">
.add-app-manager-model {
  .ant-modal-body {
    max-height: 650 - 55 - 53 - 48px;
    overflow-y: auto;
  }
}
</style>
