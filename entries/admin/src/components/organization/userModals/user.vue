<template>
  <a-drawer
    width="850"
    placement="right"
    @close="onCloseInfoModal"
    :closable="true"
    :visible="userVisible"
    wrapClassName="add-user-drawer"
  >
    <div slot="title">
      <h2>{{ modalTitle }}</h2>

      <!-- 新增的时候才会展示 -->
      <template v-if="userType !== 1">
        <a-button
          type="link"
          v-show="!showImportBtn"
          class="importFromBtn"
          @click="() => (this.showImportPeople = true)"
        >从已有人员中导入</a-button>
      </template>
    </div>
    <div class="add-user-wrapper" :class="$i18n.locale" v-if="userInfo">
      <!--基本信息-->
      <div class="box-item">
        <div class="item-title">{{ $t("languages.User.BaseInfo") }}</div>
        <div class="item-child">
          <p class="left-header item-avator-name">{{ $t("languages.User.Avatar") }}</p>
          <div class="item-avator">
            <a-upload :showUploadList="false" :beforeUpload="beforeUpload">
              <div
                :class="[
                  'item-avator__icon',
                  { 'item-avator__icon--loading': uploading },
                ]"
              >
                <img
                  v-if="userInfo.imgUrl && userInfo.imgUrl.includes('http')"
                  :src="userInfo.imgUrl"
                />
                <img
                  v-else-if="userInfo.imgUrl"
                  :src="getDownloadUrl(userInfo.imgUrl)"
                />
                <span v-if="!userInfo.imgUrl" class="icon aufontAll h-icon-all-normal_smile"></span>
                <i class="icon aufontAll h-icon-all-form-o" />
                <i class="icon aufontAll h-icon-all-loading-o" />
              </div>
            </a-upload>
            <div class="avator-tips">图片为png/jpg格式，大小100K以内</div>
          </div>
        </div>
        <div class="item-child">
          <div class="child-left">
            <p class="left-header required">{{ $t("languages.User.UserName") }}</p>
            <div class="edit-text" :class="{ 'err-input': userValid.name.valid }">
              <a-input
                v-model="userInfo.name"
                class="input-text"
                maxlength="30"
                :disabled="userType === 1"
                @change="userValid.name.valid = false"
                placeholder="请输入用户名称"
              />
              <p class="err-tips" v-if="userValid.name.valid">{{ userValid.name.errMsg }}</p>
            </div>
          </div>
          <div class="child-right">
            <p class="left-header required">{{ $t("languages.User.UserAccount") }}</p>
            <div class="edit-text" :class="{ 'err-input': userValid.username.valid }">
              <a-input
                v-model="userInfo.userId"
                class="input-text"
                maxlength="32"
                :disabled="userType === 1"
                @change="userValid.username.valid = false"
                placeholder="请输入账号"
              />
              <p class="err-tips" v-if="userValid.username.valid">{{ userValid.username.errMsg }}</p>
            </div>
          </div>
        </div>
        <div class="item-child">
          <div class="child-left">
            <p class="left-header required">{{ $t("languages.User.UserMainDepartment") }}</p>
            <!-- //TODO 暂无主部门数据，以多部门中的首个代替 -->
            <div class="edit-text" :class="{ 'err-input': userValid.mainDepartment.valid }">
              <staff-selector
                v-model="mainDepartment"
                :params="StuffSelectParams"
                :options="deptOpts"
                :keepDeptIds="mainDeptKeepIds"
                @change="userValid.mainDepartment.valid = false"
                class="user-info-staff"
              ></staff-selector>
              <p
                class="err-tips"
                v-if="userValid.mainDepartment.valid"
              >{{ userValid.mainDepartment.errMsg }}</p>
            </div>
          </div>
          <!--兼职部门-->
          <div class="child-right">
            <p class="left-header">{{ $t("languages.User.PartTimeDepartment") }}</p>
            <div class="edit-text">
              <staff-selector
                v-model="userInfo.departmentNames"
                :params="StuffSelectParams"
                :options="otherDeptOpts"
                :keepDeptIds="partTimeDeptKeepIds"
              ></staff-selector>
            </div>
          </div>
        </div>
        <!-- <div class="item-child">
          <div class="child-content">
            <p class="left-header">{{ $t('languages.User.Gender') }}</p>
            <div class="edit-text">
              <a-radio-group name="radioGroup" v-model="userInfo.gender" defaultValue="MALE">
                <a-radio value="MALE">男</a-radio>
                <a-radio value="FEMALE">女</a-radio>
              </a-radio-group>
            </div>
          </div>
        </div>-->
        <div class="item-child">
          <div class="child-content">
            <p class="left-header">{{ $t("languages.User.Role") }}</p>
            <div class="edit-text">
              <role-select
                :defaultValue="userInfo.roleIds"
                :showParent="false"
                :expandAll="true"
                defaultValueKey="id"
                :params="roleParams"
                :multiple="true"
                :filterDefaultRoleGroup="true"
                :filterDD="unitTitleObj.relatedOrgType === 'RELEVANCE'"
                @select="selectRole"
                :keepRoles="keepRolesList"
                :filterKey="codeProp"
              ></role-select>
            </div>
          </div>
        </div>
      </div>

      <!--联系方式-->
      <div class="box-item">
        <div class="item-title">{{ $t("languages.User.Contact") }}</div>
        <div class="item-child">
          <div class="child-left">
            <p class="left-header required">{{ $t("languages.User.MobilePhone") }}</p>
            <div class="edit-text" :class="{ 'err-input': userValid.mobile.valid }">
              <a-input
                v-model="userInfo.mobile"
                class="input-text"
                maxlength="20"
                :disabled="userType === 1"
                @change="userValid.mobile.valid = false"
                placeholder="请输入手机号码"
              />
              <p class="err-tips" v-if="userValid.mobile.valid">{{ userValid.mobile.errMsg }}</p>
            </div>
          </div>
          <div class="child-right">
            <p class="left-header">{{ $t("languages.User.OfficePhone") }}</p>
            <div class="edit-text">
              <a-input
                v-model="userInfo.officePhone"
                class="input-text"
                maxlength="20"
                placeholder="请输入电话"
              />
            </div>
          </div>
        </div>
        <div class="item-child">
          <div class="child-left">
            <p class="left-header">{{ $t("languages.User.Email") }}</p>
            <div class="edit-text" :class="{ 'err-input': userValid.email.valid }">
              <a-input
                v-model="userInfo.email"
                class="input-text"
                maxlength="50"
                @change="userValid.email.valid = false"
                placeholder="请输入邮箱"
              />
              <p class="err-tips" v-if="userValid.email.valid">{{ userValid.email.errMsg }}</p>
            </div>
          </div>
        </div>
      </div>

      <!--员工信息-->
      <div class="box-item last">
        <div class="item-title">{{ $t("languages.User.EmployeeInfo") }}</div>
        <div class="item-child">
          <div class="child-left">
            <p class="left-header">{{ $t("languages.User.EmployeeNumber") }}</p>
            <div class="edit-text" :class="{ 'err-input': userValid.employeeNo.valid }">
              <a-input
                v-model="userInfo.employeeNo"
                class="input-text"
                maxlength="20"
                @change="userValid.employeeNo.valid = false"
                placeholder="请输入员工编号"
              />
              <p
                class="err-tips"
                v-if="userValid.employeeNo.valid"
              >{{ userValid.employeeNo.errMsg }}</p>
            </div>
          </div>
          <div class="child-right">
            <p class="left-header">{{ $t("languages.User.EntryDate") }}</p>
            <div class="edit-text">
              <a-date-picker class="entry-date" v-model="userInfo.entryDate" />
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <a-button type="primary" @click="saveData">保存</a-button>
      </div>
    </div>

    <import-people
      :visable="showImportPeople"
      :corpId="corpId"
      @changeVisable="changeShowImportPeople"
      @update="changePeoPleInfo"
    />
  </a-drawer>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { State, namespace } from "vuex-class";
import moment from "moment";
import OrgApi from "@/apis/organization";
import appBaseApi from "@/apis/app-settings/base.api";

import StaffSelector from "@cloudpivot/form/src/common/components/form-staff-selector/pc/staff-selector.vue";
import common from "@cloudpivot/common/pc";

import ImportPeople from "./import-people.vue";

const UserModule = namespace("Organization/User");

@Component({
  name: "add-user",
  components: {
    StaffSelector,
    RoleSelect: common.components.RoleSelect,
    ImportPeople,
  },
})
export default class AddUser extends Vue {
  // @UserModule.State("unitTitleObj") unitTitleObj: any;

  @Prop() value!: boolean;
  @Prop() unitTitleObj!: any;

  @Prop() userType!: number; // 0：新增，1：编辑

  @Prop() userData!: any;

  get corpId() {
    const { corpId } = this.unitTitleObj;
    return corpId;
  }

  get apiHost() {
    return (window as any).config.apiHost;
  }

  get token() {
    return window.localStorage.getItem("token");
  }
  // 主组织自维护，新增人员要隐藏导入 入口
  get showImportBtn() {
    let { relatedSyncType, relatedOrgType } = this.unitTitleObj;
    return relatedSyncType === "PUSH" && relatedOrgType === "MAIN";
  }

  codeProp: string = "code";

  keepRolesList: any = [{ code: "SYS_2000000" }, {code: "SYS_1000000"}];

  userVisible: boolean = false;

  modalTitle: string = "新建用户信息";
  userInfo: any = {
    name: '',
    mobile: '',
    userId: '',
    departmentNames: [],
    roleIds: [],
  };

  userValid: any = {
    name: {
      valid: false,
      errMsg: "仅限50个字符以内",
    },
    username: {
      valid: false,
      errMsg: "仅限20个字符以内，且仅支持输入字母和数字",
    },
    mainDepartment: {
      valid: false,
      errMsg: "主部门不允许为空",
    },
    mobile: {
      valid: false,
      errMsg: "请输入正确的手机号码",
    },
    email: {
      valid: false,
      errMsg: "邮箱格式错误",
    },
    employeeNo: {
      valid: false,
      errMsg: "员工编号只允许字母和数字",
    },
  };

  mainDepartment: any = []; // 主部门

  uploading: boolean = false; // 是否上传中

  file: File | null = null; // 上传的图片文件

  deptOpts: any = {
    selectOrg: true,
    selectUser: false,
    showModel: false,
    mulpitle: false,
    showSelect: true,
    placeholder: "请选择",
    appManagerFilter: true,
    rootNode: [],
  };

  otherDeptOpts: any = {
    selectOrg: true,
    selectUser: false,
    showModel: false,
    mulpitle: true,
    showSelect: true,
    placeholder: "请选择",
    appManagerFilter: true,
    rootNode: [],
  };
  // 导入人员参数
  showImportPeople: boolean = false;
  isImportPeople: boolean = false;

  // 当前用户所属组织的corpId
  curCorpId: string = '';

  mainDeptKeepIds:string[] = [];
  partTimeDeptKeepIds:string[] = [];

  created() { }

  get roleParams() {
    // if (this.userType === 1) return {};
    // // 新增人员的时候需要过滤主管角色
    return { roleType: "SYS" };
  }
  get StuffSelectParams() {
    const { userType } = this;
    const cid:string = userType === 1 ? this.curCorpId : this.corpId
    return { corpId: cid, filterType: "admin_corp" };

    // 以下代码为何只对关联组织进行处理 todo
    if (this.unitTitleObj.relatedOrgType === "RELEVANCE") {
      // return { corpId: this.unitTitleObj.corpId }
      return { corpId: this.curCorpId }; // 上面的方式拿不到corpId, 所以用传参的方式传进来
    }
    return {};
  }
  // 获取当前用户的信息
  async getUserInfo(user: any) {
    const params = {
      id: user.id,
    };
    const res = await OrgApi.getOrgUserInfo(params);
    if (res.errcode === 0 && res.data) {
      this.curCorpId = res.data.corpId;
      this.userInfo = res.data;
      // this.userInfo.imgUrl = this.getDownloadUrl(this.userInfo.imgUrl); // 不能修改此字段的值，否则提交会报错，因为长度超出
      this.userInfo.entryDate = this.userInfo.entryDate
        ? moment(this.userInfo.entryDate, "YYYY-MM-DD")
        : null;
      this.isImportPeople = res.data.isImport;
      // 设置主部门
      this.mainDepartment = this.userInfo.mainDepartmentName
        ? [
          {
            name: this.userInfo.mainDepartmentName.name,
            id: this.userInfo.mainDepartmentName.id,
            unitType: 1,
            operatable: this.userInfo.mainDepartmentName.operatable,
          },
        ]
        : [];
        this.mainDeptKeepIds = this.mainDepartment.map((item:any) => {
          if (!item.operatable) {
            return item.id;
          } 
        });
        this.partTimeDeptKeepIds = (res.data.departmentNames || []).map((item:any) => {
          if (!item.operatable) {
            return item.id;
          } 
        });
    }
  }

  /**
   * @desc 导入人员
   */
  changePeoPleInfo(info) {
    if (info) {
      let { name, mobile, username } = info;
      this.userInfo.name = name;
      this.userInfo.mobile = mobile;
      this.userInfo.userId = username;
      this.isImportPeople = true;
    } else {
      this.userInfo.name = "";
      this.userInfo.mobile = "";
      this.userInfo.userId = "";
      this.isImportPeople = false;
    }

    this.changeShowImportPeople(false);
  }

  /**
   * @desc 切换展示容易有人员导入弹框
   */
  changeShowImportPeople(showImportPeople) {
    this.showImportPeople = showImportPeople;
  }

  /*
   * 选择角色
   */
  selectRole(value: any[]) {
    console.log("role:", value);
    if (!value || !value.length) {
      this.userInfo.roleIds = [];
      return;
    }
    this.userInfo.roleIds = value.map((role: any) => {
      return role.id;
    });
  }

  /**
   * 获取上传的应用图标并判断是否符合限制
   */
  beforeUpload(file: File) {
    this.uploading = true;
    this.$nextTick(() => {
      this.uploading = false;
    });
    const isPic = ["image/jpeg", "image/png"].includes(file.type);
    const isLimitSize = file.size / 1024 < 100;
    if (!isPic) {
      this.$message.error(this.$t("languages.appSettings.PlzUploadImageFile"));
      return false;
    }
    if (!isLimitSize) {
      this.$message.error(
        this.$t("languages.appSettings.ImageSizeTip", { size: "100KB" })
      );
      return false;
    }
    if (isPic && isLimitSize) {
      this.file = file;
      const URL = window.URL || (window as any).webkitURL;
      this.userInfo.imgUrl = URL.createObjectURL(file);
    }
    return false;
  }

  getDownloadUrl(refId: string) {
    if (!refId) {
      return "";
    } else if (refId.indexOf("http") > -1) {
      return refId;
    } else {
      let url = `${this.apiHost}/api/aliyun/download?refId=${refId}`;
      if (this.token) {
        url += "&access_token=" + this.token;
      }
      return url;
    }
  }

  // 保存
  async saveData() {
    if(!this.isImportPeople) { // 不是导入的，全部需要校验
      const isDataOk:boolean = this.validInfo();
      if (!isDataOk) {
        return;
      }
    } else { // 导入人员，只校验手机号
      let isDataOk:boolean = true;

      if (!/^1[3|4|5|6|7|8|9][0-9]{9}$/.test(this.userInfo.mobile)) {
        this.userValid.mobile.valid = true;
        isDataOk = false;
      } else {
         this.userValid.mobile.valid = false;
          isDataOk = true;
      }

      if (!isDataOk) return;
    }

    let imgUrl = "";
    if (this.file) {
      this.uploading = true;
      const res: any = await appBaseApi.uploadFile({ file: this.file });
      this.userInfo.imgUrlId = res.data.refId;
      this.uploading = false;
      this.file = null;
      imgUrl = `${res.data.refId}${res.data.name}` as any;
    }

    const deptIds = this.userInfo.departmentNames
      ? this.userInfo.departmentNames.map((dept: any) => {
        return dept.id;
      })
      : [];

    const entryTime = this.userInfo.entryDate
      ? moment(this.userInfo.entryDate).format("YYYY-MM-DD")
      : null;

    if (this.userType === 1) {
      // 编辑用户接口
      const params: any = {
        departmentId: this.mainDepartment[0].id,
        deptIds,
        roleIds: this.userInfo.roleIds,
        username: this.userInfo.userId,
        name: this.userInfo.name,
        mobile: this.userInfo.mobile,
        officePhone: this.userInfo.officePhone,
        email: this.userInfo.email,
        employeeNo: this.userInfo.employeeNo,
        entryTime,
        imgUrl: imgUrl ? imgUrl : this.userInfo.imgUrl,
        imgUrlId: this.userInfo.imgUrlId,
        id: this.userInfo.id,
      };

      OrgApi.updateUser(params).then((res: any) => {
        if (res.errcode) {
          this.$message.error(res.errmsg);
          return;
        }

        this.$message.success("编辑用户成功！");
        this.$emit("reloadTree");
        this.onCloseInfoModal();
      });
    } else {
      // 新建用户接口
      let params: any = {
        departmentId: this.mainDepartment[0].id,
        deptIds,
        roleIds: this.userInfo.roleIds,
        username: this.userInfo.userId,
        name: this.userInfo.name,
        mobile: this.userInfo.mobile,
        officePhone: this.userInfo.officePhone,
        email: this.userInfo.email,
        employeeNo: this.userInfo.employeeNo,
        entryTime,
        imgUrl: imgUrl ? imgUrl : this.userInfo.imgUrl,
        imgUrlId: this.userInfo.imgUrlId,
      };
      // 导入人员需要做区分
      if (this.isImportPeople) {
        params.isImport = true;
      }
      OrgApi.addUser(params).then((res: any) => {
        if (res.errcode) {
          this.$message.error(res.errmsg);
          return;
        }

        this.$message.success("新建用户成功！");
        this.$emit("reloadTree");
        this.onCloseInfoModal();
      });
    }
    this.$emit("watchChild");
  }

  isAdd() {
    return this.userType !== 1;
  }

  // 校验用户信息合法性
  validInfo() {
    let flag = true;
    // 校验用户姓名
    if (
      this.isAdd() &&
      (!this.userInfo.name ||
        !/^[a-zA-Z0-9\u4e00-\u9fa5]{1,29}$/.test(this.userInfo.name))
    ) {
      // 仅限30个字符以内，并不能以空格开头
      this.userValid.name.valid = true;
      flag = false;
    }

    // 校验用户账号
    if (
      this.isAdd() &&
      (!this.userInfo.userId ||
        !/^[a-zA-Z0-9]{1,32}$/.test(this.userInfo.userId))
    ) {
      // 仅支持字母、数字、不超过32个字符
      this.userValid.username.valid = true;
      flag = false;
    }

    // 校验主部门
    if (!this.mainDepartment || !this.mainDepartment.length) {
      this.userValid.mainDepartment.valid = true;
      flag = false;
    }

    // 校验手机号
    if (
      this.isAdd() &&
      !/^1[3|4|5|6|7|8|9][0-9]{9}$/.test(this.userInfo.mobile)
    ) {
      this.userValid.mobile.valid = true;
      flag = false;
    }

    // 校验邮箱
    if (
      this.userInfo.email &&
      !/^[A-Za-z0-9\u4e00-\u9fa5]+((\.[a-zA-Z0-9\u4e00-\u9fa5_-]+)+)?@[a-zA-Z0-9\u4e00-\u9fa5_-]+(\.[a-zA-Z0-9\u4e00-\u9fa5_-]+)+$/.test(
        this.userInfo.email
      )
    ) {
      this.userValid.email.valid = true;
      flag = false;
    }

    // 校验员工编号
    if (
      this.userInfo.employeeNo &&
      !/^[a-zA-Z0-9]{1,32}$/.test(this.userInfo.employeeNo)
    ) {
      // 仅支持字母、数字、不超过20个字符
      this.userValid.employeeNo.valid = true;
      flag = false;
    }

    return flag;
  }

  resetUserValid() {
    this.userValid = {
      name: {
        valid: false,
        errMsg: "用户姓名不合法",
      },
      username: {
        valid: false,
        errMsg: "账号不合法",
      },
      mainDepartment: {
        valid: false,
        errMsg: "主部门不允许为空",
      },
      mobile: {
        valid: false,
        errMsg: "手机号格式不合法",
      },
      email: {
        valid: false,
        errMsg: "邮箱格式错误",
      },
      employeeNo: {
        valid: false,
        errMsg: "员工编号只允许字母和数字",
      },
    };
  }

  onCloseInfoModal() {
    this.userVisible = false;
    this.isImportPeople = false;
    this.userInfo = { departmentNames: [], roleIds: [],  name: '',
    mobile: '',
    userId: '' };
    this.resetUserValid();
    this.$emit("input", false);
  }

  @Watch("value")
  onValueChange(v: boolean) {
    this.userVisible = v;
    if (!v) {
      return;
    }

    if (this.userType === 1) {
      this.modalTitle = "编辑用户信息";
      this.getUserInfo(this.userData);
    } else {
      this.modalTitle = "新建用户信息";
      this.mainDepartment = [
        {
          name: this.unitTitleObj.name,
          id: this.unitTitleObj.id,
          unitType: 1,
        },
      ];
    }
  }
}
</script>

<style lang="less">
.add-user-drawer {
  .ant-drawer-body {
    padding-top: 0;
  }

  .importFromBtn {
    position: absolute;
    right: 60px;
    top: 18px;
  }
  .add-user-wrapper {
    padding: 0;

    .role-selector__span {
      float: left;
    }

    .box-item {
      padding: 21px 0 19px;
      border-bottom: 1px solid rgb(232, 232, 232);
      &.last {
        border-bottom: 0 none;
        margin-bottom: 24px;
      }
      .item-title {
        padding-bottom: 6px;
        text-align: left;
        font-size: 16px;
        color: #000;
        font-weight: 600;
      }
      .item-child {
        font-size: 0;
        white-space: nowrap;
        padding: 8px 0;
        p,
        .edit-text {
          display: inline-block;
          vertical-align: middle;
          margin-bottom: 0;
        }
        .edit-text {
          width: 70%;
          .ant-radio-wrapper {
            margin-right: 46px;
          }
          .entry-date {
            width: 100%;
          }
          /deep/ .h3-organization__label {
            max-height: 33px;
            overflow-y: auto;
            overflow-x: hidden;
            white-space: normal;
          }
          &.err-input {
            position: relative;
            /deep/ .ant-input,
            .h3-organization__label {
              border-color: #f5222d !important;
              &:focus {
                box-shadow: 0 0 0 2px rgba(245, 34, 45, 0.2);
              }
            }
            .err-tips {
              font-size: 12px;
              color: #f5222d;
              text-align: left;
              line-height: 20px;
              position: absolute;
              top: 30px;
              left: 8px;
            }
          }
        }
        .item-avator-name {
          display: inline-block;
          vertical-align: top;
          font-size: 14px;
        }
        .item-avator {
          display: inline-block;
          vertical-align: top;
          border-radius: 4px;
          overflow: hidden;
          .avator-tips {
            font-size: 14px;
            margin-top: 8px;
            color: rgba(0, 0, 0, 0.45);
          }
        }
        .child-left,
        .child-right,
        .child-content {
          font-size: 14px;
        }
        .child-left,
        .child-right {
          display: inline-block;
          vertical-align: top;
          width: 50%;
        }
        .child-content {
          width: 100%;
          .edit-text {
            width: 87%;
            .role-selector__wrap {
              width: 100%;
              .role-selector__input {
                width: 100%;
              }
            }
          }
        }
        .child-right {
          margin-left: 20px;
        }
        .left-header {
          width: 80px;
          margin-right: 8px;
          margin-left: 8px;
          color: rgba(0, 0, 0, 0.65);
          &.required {
            position: relative;
            &:before {
              content: "*";
              color: @error-color;
              position: absolute;
              left: -0.5em;
            }
          }
        }
      }
    }
    .footer {
      text-align: center;
      position: absolute;
      height: 50px;
      line-height: 50px;
      left: 0;
      bottom: 0;
      width: 100%;
      z-index: 6;
      background: #fff;
      border-top: 1px solid #e8e8e8;
    }
  }
  .item-avator__icon {
    position: relative;
    width: 64px;
    height: 64px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }
    span {
      font-size: 64px;
      line-height: 64px;
      color: #ffb131;
    }
    i {
      visibility: hidden;
    }
    &:hover,
    &--loading {
      i {
        position: absolute;
        z-index: 9;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        color: #fff;
        text-align: center;
        line-height: 64px;
      }
      &:after {
        content: "";
        display: block;
        position: absolute;
        z-index: 5;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: rgba(0, 0, 0, 0.45);
      }
    }
    &:hover:not(.item-avator--loading) {
      i.h-icon-all-form-o {
        visibility: visible;
      }
    }
    &--loading {
      i.h-icon-all-loading-o {
        visibility: visible;
        animation: rotating 1s linear infinite;
      }
    }
  }
}
</style>
