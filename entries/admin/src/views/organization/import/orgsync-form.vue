<template>
  <div>
    <a-modal
      v-model="showModal"
      title="组织同步"
      :width="554"
      :destroyOnClose="true"
      okText="立即同步"
      cancelText="取消"
      @ok="submit"
      @cancel="cancel"
      :maskClosable="false"
      :keyboard="false"
    >
      <a-form class="orgsync-form" :form="form">
        <a-form-item
          label="同步组织"
          :labelCol="formItemLayout.labelCol"
          :wrapperCol="formItemLayout.wrapperCol"
        >
          <a-select
            v-model="form.corpId"
            placeholder="请选择"
            @change="selectOrgSync"
          >
            <a-select-option
              v-for="(item, index) in orgSelectOptions"
              :key="index"
              :value="item.corpId"
              >{{ item.name }}</a-select-option
            >
          </a-select>
        </a-form-item>

        <a-form-item
          label="同步方式"
          :labelCol="formItemLayout.labelCol"
          :wrapperCol="formItemLayout.wrapperCol"
        >
          <a-radio-group v-model="form.syncMethod" @change="toggleSyncMethod">
            <a-radio :value="1">全量同步</a-radio>
            <a-radio :value="2">部分同步</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item
          label="同步部门"
          :labelCol="formItemLayout.labelCol"
          :wrapperCol="formItemLayout.wrapperCol"
          v-if="isShowDepartment"
          :class="{ 'has-error': departmentError }"
        >
          <div class="orgsync-form-select-wrapper">
            <a-tree-select
              :treeData="treeData"
              style="width: 100%; "
              dropdownClassName="orgsync-form-tree-select"
              class="orgsync-form-item"
              v-model="form.departments"
              :treeExpandedKeys="treeExpandedKeys"
              placeholder="请选择"
              :treeCheckable="true"
              treeCheckStrictly
              labelInValue
              @treeExpand="onTreeExpand"
            >
            </a-tree-select>
          </div>
          <div class="ant-form-explain" v-if="departmentError">
            同步部门不能为空
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      width="422px"
      title="提示"
      :visible="visible"
      @ok="handleOk"
      @cancel="visible = !visible"
      okText="前往配置"
      cancelText="暂不配置"
      class="config-tips"
      :maskClosable="false"
      :keyboard="false"
    >
      <p>钉钉信息未配置，无法同步</p>
      <p>
        请前往
        <span class="heighlight">系统管理-常规设置</span> 配置钉钉信息
      </p>
    </a-modal>
    <a-modal
      width="520px"
      title
      :visible="showErrorTip"
      class="error-tips"
      :maskClosable="false"
      :keyboard="false"
      :closable="false"
    >
      <div class="error-top">
        <i
          class="icon aufontAll h-icon-all-exclamation-circle icon-warning"
        ></i>
        <span class="error-title">部分同步成功，以下数据有异常，请处理</span>
      </div>
      <div class="error-content">
        <ul>
          <li v-for="(data, index) in errorData" :key="index">
            <div class="dot"></div>
            <span>{{ data }}</span>
          </li>
        </ul>
      </div>
      <template slot="footer">
        <a-button
          key="print"
          type="primary"
          @click="showErrorTip = !showErrorTip"
          >确定</a-button
        >
      </template>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Model, Watch } from "vue-property-decorator";
import { TreeSelect } from "@h3/antd-vue";

import { State, namespace } from "vuex-class";

import OrgApi from "@/apis/organization";

@Component({
  name: "orgsync-form",
})
export default class orgsyncForm extends Vue {
  showModal: boolean = false;
  isShowDepartment: boolean = false;
  treeExpandedKeys: string[] = [];
  orgSelectOptions: any = []; // 同步组织下拉选项
  visible: boolean = false;
  showErrorTip: boolean = false;
  departmentError: boolean = false;
  errorData: any = [];

  // 表单数据
  form: any = {
    corpId: "", // 组织机构ID
    syncMethod: 1, // 同步方式
    departments: [], // 组织部门
  };

  formItemLayout: any = {
    labelCol: {
      span: 6,
    },
    wrapperCol: {
      span: 18,
    },
  };

  // 同步部门的数据
  treeData: Array<Organization.treeData> = [];
  showParent: any = (TreeSelect as any).SHOW_PARENT;

  @Model("change") value!: boolean;

  @Watch("value")
  onValueChange(v: boolean) {
    this.showModal = v;
    this.isShowDepartment = false;

    if (v) {
      this.getOrgsyncList();
    } else {
      this.resetData();
    }
  }

  @Watch("form.syncMethod")
  onSyncMethodChange(syncMethod) {
    syncMethod === 1
      ? (this.isShowDepartment = false)
      : (this.isShowDepartment = true);
  }

  @Watch("form.departments")
  onDepartmentsChange(newValue: Array<object>, oldValue: Array<object>) {
    // 同步部门为空时，显示提示信息
    if (this.departmentError) {
      if (newValue.length) {
        this.departmentError = false;
      } else {
        this.departmentError = true;
      }
    }

    // 勾选中自动展开下一级
    let department: any = {};

    if (newValue.length > oldValue.length) {
      department = newValue[newValue.length - 1] as any;
    } else {
      department = this.getUnCheckDepartment(newValue, oldValue);
    }

    if (!department.value) return;

    const parseValue: any = JSON.parse(department.value);

    const value: string = parseValue.value;
    const hasChild: boolean = parseValue.hasChild;
    !this.treeExpandedKeys.includes(value) &&
      hasChild &&
      this.treeExpandedKeys.push(value);
  }

  /**
   * 重新组装树需要的数据
   */
  reRenderTreeData(data: any) {
    const res: any = data instanceof Array ? [] : {};

    for (let key in data) {
      if (!data[key]) continue;

      if (!data.hasOwnProperty(key)) continue;

      if (typeof data[key] === "object") {
        res[key] = this.reRenderTreeData(data[key]);
      } else {
        if (key === "name") res["title"] = data[key];

        if (key === "id") {
          const value: any = {
            value: data[key],
            corpId: data["corpId"],
            parentid: data["parentid"],
          };

          if (data.children && data.children.length) {
            value.hasChild = true;
          } else {
            value.hasChild = false;
          }

          res["key"] = data[key];
          res["value"] = JSON.stringify(value);
        }
      }
    }

    return res;
  }

  /**
   * 单击三角符展开树
   */
  onTreeExpand(expandedKeys) {
    this.treeExpandedKeys = expandedKeys;
  }

  /**
   * 切换同步组织
   */
  selectOrgSync(value: string, option: any) {
    this.resetDepartment();
  }

  /**
   * 切换同步方式
   */
  toggleSyncMethod(e) {
    this.resetDepartment();
  }

  /**
   * 重置同步部门
   */
  resetDepartment() {
    if (this.form.syncMethod === 1) return;
    this.form.departments = [];
    this.treeExpandedKeys = [];
    this.loadDepartmentByCorpId();
  }

  /**
   * 清空data数据
   */
  resetData() {
    this.treeExpandedKeys = [];
    this.orgSelectOptions = []; // 同步组织列表
    this.errorData = [];
    this.departmentError = false;

    this.form = {
      corpId: "", // 组织机构ID
      syncMethod: 1, // 同步方式
      departments: [], // 组织部门
    };
  }

  /**
   * 获取全量同步的参数
   */
  getRelatedId() {
    let id: string = "";

    for (let i = 0, len = this.orgSelectOptions.length; i < len; i++) {
      if (this.orgSelectOptions[i].corpId !== this.form.corpId) continue;
      id = this.orgSelectOptions[i].id;
      break;
    }

    return id;
  }

  /**
   * 获取部分同步的参数
   */
  getPartSyncParams() {
    const res: Array<Organization.partSyncParams> = [];
    const departments = this.form.departments;

    for (let i = 0, len = departments.length; i < len; i++) {
      const value = JSON.parse(departments[i].value);
      const item: any = {
        parentId: value.parentid,
        id: value.value,
      };

      if (i === 0) item.corpId = value.corpId;

      res.push(item);
    }

    return res;
  }

  /**
   * 通过组织的corpId加载所有同步部门
   */
  async loadDepartmentByCorpId() {
    const res: any = await OrgApi.getDepartmentByCorpId({
      corpId: this.form.corpId,
    });

    if (res.errcode === 0) {
      this.treeData = this.reRenderTreeData(res.data);
    } else {
      this.$message.error(res.errmsg);
    }
  }

  /**
   * 获取钉钉关联组织列表
   */
  async getOrgsyncList() {
    const res: any = await OrgApi.orgSyncCheck();

    if (res.errcode && res.errcode !== 0) {
      this.$message.error("同步组织接口错误");
      return;
    }

    if (res.data && res.data.length === 0) {
      this.$message.error("配置错误，请检查配置");
      return;
    }

    if (res.data && res.data.length !== 0) {
      let selectList = {};
      this.orgSelectOptions = [];

      res.data.forEach((r: any) => {
        selectList = {
          id: r.id,
          name: r.name,
          corpId: r.corpId,
        };

        this.orgSelectOptions.push(selectList);
      });

      // 默认选中第一项
      this.form.corpId = this.orgSelectOptions[0].corpId;
    }
  }

  /**
   * 立即同步，提交表单
   */
  async submit() {
    let params: any = this.form.syncMethod === 1 ? {} : [];

    // 如果为部分同步，并且同步部门为空，则显示提示信息
    if (this.form.syncMethod === 2 && this.form.departments.length === 0) {
      this.departmentError = true;
      return;
    }

    const loading = this.$message.loading("同步中", 0) as any;
    this.$emit("change", false);

    if (this.form.syncMethod === 1) {
      params.relatedId = this.getRelatedId();
    } else {
      params = this.getPartSyncParams();
    }

    await this.getOrgsync(params);

    loading();
  }

  // 立即同步，发起请求
  async getOrgsync(param: any) {
    const res: any =
      this.form.syncMethod === 1
        ? await OrgApi.allSynchronize(param)
        : await OrgApi.partSynchronize(param);

    if (res.errcode === 0) {
      this.$message.success(res.errmsg, 2);
      return;
    }

    if (+res.errcode === 10026) {
      if (res.data && typeof res.data === "object") {
        const dataArr = Object.entries(res.data);

        dataArr.forEach((d: any) => {
          if (!d && !d[0] && !d[1]) {
            return;
          }

          const [key, value] = d;
          this.errorData.push(value);
        });

        this.showErrorTip = true;
      }
    } else if (+res.errcode === 10021) {
      this.visible = true;
    } else {
      this.$message.error(res.errmsg, 2);
    }
  }

  /**
   * 获取去掉勾的选项
   */
  getUnCheckDepartment(newValue: Array<any>, oldValue: Array<any>) {
    let res: any = {};

    // debugger;
    for (let i = 0, len = oldValue.length; i < len; i++) {
      const oValue: string = JSON.parse(oldValue[i].value).value;

      for (let k = 0, ken = newValue.length; k < ken; k++) {
        const nValue: string = JSON.parse(newValue[k].value).value;

        if (oValue === nValue) break;

        if (k >= ken - 1) {
          res = oldValue[i];
          break;
        }
      }

      if (res.value) break;
    }

    return res;
  }

  /**
   * 关闭弹窗
   */
  cancel() {
    this.$emit("change", false);
  }

  /**
   *  未配置钉钉信息
   */
  handleOk() {
    this.$router.push({
      name: "commonSetting",
    }).catch((err: any) => {err});
  }
}
</script>

<style lang="less">
.config-tips {
  p {
    margin-bottom: 8px;
    .heighlight {
      color: @primary-color;
    }
  }
}
.error-tips {
  .ant-modal-footer {
    border-top: none;
    padding-top: 0;
  }
  .error-top {
    margin-top: 8px;
    margin-left: 8px;
    .icon-warning {
      color: #faad14;
      font-size: 22px;
    }
    .error-title {
      display: inline-block;
      font-size: 16px;
      font-family: "PingFangSC-Medium";
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
      line-height: 24px;
      margin-left: 16px;
      vertical-align: text-bottom;
    }
  }
  .error-content {
    margin: 10px 8px 0 8px;
    background: #fffbe6;
    max-height: 260px;
    overflow: auto;
    border: 1px solid #ffe58f;
    padding: 12px;
    border-radius: 4px;
    color: rgba(0, 0, 0, 0.85);
    font-size: 14px;
    .dot {
      display: inline-block;
      width: 5px;
      height: 5px;
      margin-right: 8px;
      vertical-align: middle;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.45);
    }
  }
}
</style>

<style lang="less">
.orgsync-form {
  .ant-form-explain {
    margin-top: 5px;
  }

  .orgsync-form-select-wrapper {
    box-sizing: border-box;
    background-color: #fff;
    border: 1px solid #d9d9d9;
    border-top-width: 1.02px;
    border-radius: 4px;
    outline: none;
    overflow: hidden;
    -webkit-transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);

    .orgsync-form-item {
      .ant-select-selection {
        max-height: 200px;
        overflow: hidden;
        overflow-y: auto;

        box-sizing: inherit;
        background-color: #fff;
        border: none;
        transition: none;
      }
    }
  }
}

.orgsync-form-tree-select {
  max-width: 380px;

  &.ant-select-tree-dropdown {
    max-height: 45vh !important;
  }
  .ant-select-tree li span.ant-select-tree-checkbox {
    display: inline-block;
  }
  .ant-select-tree
    li
    span.ant-select-tree-checkbox
    + .ant-select-tree-node-content-wrapper {
    width: calc(100% - 46px);
  }
  .ant-select-tree
    > .ant-select-tree-treenode-checkbox-checked
    > .ant-select-tree-node-content-wrapper,
  .ant-select-tree-child-tree
    .ant-select-tree-treenode-checkbox-checked
    .ant-select-tree-node-content-wrapper {
    background: none !important;
    font-weight: normal;
  }

  .ant-select-tree-title {
    max-width: 90%;
    overflow: hidden;
    display: inline-block;
    vertical-align: middle;
    text-overflow: ellipsis;
  }

  .ant-select-tree-node-content-wrapper {
    background-color: #ffffff !important;
  }
  .ant-select-tree-node-content-wrapper:after {
    content: "";
    display: none !important;
  }
}
</style>
