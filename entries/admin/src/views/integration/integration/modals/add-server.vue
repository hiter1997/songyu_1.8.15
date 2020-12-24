<template>
  <div class="add-server">
    <section class="add-server__block">
      <h3 class="add-server__title">基本信息</h3>
      <div class="add-server__form">
        <div class="add-server__item">
          <span class="label-required">服务编码：</span>
          <p>
            <template v-if="isEdit">{{ form.code }}</template>
            <form-input
              v-else
              v-model="form.code"
              placeholder="请输入服务编码，例：bpmH3_01"
              :rules="rules.code"
            />
          </p>
        </div>
        <div class="add-server__item">
          <span class="label-required">服务名称：</span>
          <p>
            <form-input v-model="form.name" placeholder="请输入服务名称" :rules="rules.name" />
          </p>
        </div>
        <div class="add-server__item">
          <span class="label-required">适配器：</span>
          <p>
            <template v-if="isEdit">{{ form.adapterCode }}</template>
            <a-select v-else v-model="form.adapterCode" @change="selectAdapter">
              <a-select-option v-for="d in adapters" :key="d.code">{{ d.name }}</a-select-option>
            </a-select>
          </p>
        </div>
        <div class="add-server__item" v-show="authlist.length">
          <span>授权方式：</span>
          <p>
            <!-- <template v-if="isEdit">{{ configs.auth.name }}</template> -->
            <a-select v-model="configs.auth.code" @change="selectAuth">
              <a-select-option v-for="a in authlist" :key="a.code">{{ a.name }}</a-select-option>
            </a-select>
          </p>
        </div>

        <div class="add-server__item">
          <span>服务类型：</span>
          <p>
            <a-radio-group
              name="radioGroup"
              v-model="form.shared"
            >
              <a-radio :value="false">私有</a-radio>
              <a-radio :value="true">共享</a-radio>
            </a-radio-group>
          </p>
        </div>

        <div class="add-server__item" v-show="form.shared">
          <span>共享人员：</span>
          <p>
            <a-select mode="multiple" optionFilterProp="title" v-model="form.userIdList">
              <a-select-option
                v-for="(user, index) in appManagers"
                :key="index"
                :value="user.id"
                :title="user.name"
                :disabled="user.disabled"
              >{{ user.name }}</a-select-option>
            </a-select>
          </p>
        </div>

      </div>
    </section>
    <section class="add-server__block">
      <h3 class="add-server__title">属性名称</h3>
      <!-- 普通适配器授权信息 -->
      <div class="add-server__form" v-if="configs.auth.code">
        <!-- 公共参数配置 -->
        <div
          class="add-server__item add-server__item--full"
          v-for="(item,i) in configs.commonlist"
          :key="i"
        >
          <span :class="item.required && 'label-required'">{{ item.name }}：</span>
          <p>
            <form-input
              v-model="item.value"
              :rules="[{required: item.required, message: '请填写内容'}]"
            />
          </p>
        </div>
        <!-- 授权方式独有的参数 -->
        <div
          class="add-server__item"
          v-for="(param,j) in configs.auth.parameterlist"
          :key="param.code + j"
        >
          <span :class="param.required && 'label-required'">{{ param.name }}：</span>
          <p>
            <form-input
              v-model="param.value"
              :rules="[{required: param.required, message: '请填写内容'}]"
            />
          </p>
        </div>
      </div>
      <!-- 数据库适配器授权信息 -->
      <div class="add-server__form" v-else-if="form.adapterCode &&IsDatabaseAdapter">
        <div class="add-server__item">
          <span>数据库连接池：</span>
          <p>
            <a-select v-model="form.sqlConnectCode" @change="selectSql">
              <a-select-option
                v-for="sql in databaseOptions"
                :key="sql.code"
                :value="sql.code"
                :title="sql.name"
              >{{ sql.name }}</a-select-option>
            </a-select>
          </p>
        </div>
      </div>
    </section>
    <div class="add-server__footer">
      <a-button type="primary" @click="save">保存</a-button>
    </div>
  </div>
</template>
<script lang="ts">
interface ServerWithSqlParams extends BizService.Service.CreateParams {
  sqlConnectCode: string
}

import { Component, Vue, Prop } from 'vue-property-decorator';
import { namespace, State, Action } from 'vuex-class';
import FormInput from '@/components/global/form-input/index.vue';
import { pattern, nameValidator } from '@/common/utils';

import StaffSelector from "@cloudpivot/form/src/common/components/form-staff-selector/pc/staff-selector.vue";

const ServiceModule = namespace('Integration/Service');

import * as BizSql from '@/apis/biz-sql/index';

@Component({
  name: "add-server",
  components: {
    FormInput,
    StaffSelector
  }
})

export default class AddServer extends Vue {
  @ServiceModule.State('adapters') adapters!: BizService.AdapterConfig[];
  @ServiceModule.State('categoryId') categoryId!: string;

  @ServiceModule.Action('createService') createService!: any;
  @ServiceModule.Action('updateService') updateService!: any;

  @Prop() server!: any;

  // 是否为编辑，false则为新建
  isEdit: boolean = false;
  // 编辑信息
  form: ServerWithSqlParams = {
    code: '',
    configJson: '',
    description: '',
    name: '',
    adapterCode: '',
    sqlConnectCode: '',
    serviceCategoryId: '',
    shared: false,
    userIdList: [],
  };
  // 授权配置信息
  configs: any = {
    auth: {
      code: '',
      name: '',
      parameterlist: [],
    },
    commonlist: []
  };
  // 授权方式选项
  authlist: BizService.AuthItem[] = [];
  // 规则
  rules: any = {
    code: [
      {
        required: true,
        message: '请填写服务编码'
      },
      {
        pattern: pattern('code'),
        message: '以字母开头不超过28个字符，仅支持字母、数字、下划线'
      }
    ],
    name: [
      {
        required: true,
        message: '请填写服务名称'
      },
      {
        validator: nameValidator,
        message: '仅限50个字符以内，并不能以空格开头'
      }
    ]
  };
  // 数据库适配器编码正则
  databaseReg: RegExp = new RegExp(/^DATA_/);

  // 数据库连接列表
  databaseOptions: Array<BizSql.poolItem> = [];

  // 共享人员选人控件配置参数
  
   userOpts: any = {
    selectOrg: false,
    selectUser: true,
    showModel: false,
    mulpitle: true,
    showSelect: true,
    placeholder: "请选择人员",
    appManagerFilter: true,
    isInit: false,
    rootNode: [],
    selected: [],
  };

  userIdList: any[] | null = [];

  appManagers:any[] = [];

  // 是否是数据库类型适配器，如果是，不展示授权方式
  get IsDatabaseAdapter() {
    if (this.form.adapterCode && this.databaseReg.test(this.form.adapterCode)) {
      return true;
    }
    return false;
  }

  /**
   * 获取应用管理原
   * */ 
  async getAPPManagers(){
    const selectUserIds:string = this.server.userIdList ? this.server.userIdList.join(',') : '';
    const res:any = await BizSql.getAppManagers(selectUserIds);
    const { errcode, data, errmsg } = res;
    data.forEach((item:any) => {
      item.disabled = !item.select;
    })
    if (errcode === 0)  {
      this.appManagers = data || [];
    } else {
      this.$message.error(errmsg)
    }
  }

  /**
   * 获取数据库连接列表
   */
  getSqlConnections() {
    // 获取数据库连接列表
    BizSql.getBizSqlList().then((res: Common.Data) => {
      if (res.errcode === 0) {
        if (Array.isArray(res.data)) {
          this.databaseOptions = res.data;
        } else {
          this.$message.warning('获取到的数据库连接列表错误：不是数组！');
        }
      } else {
        const msg: string = res.errmsg || '请求接口出错！';
        this.$message.error(msg);
      }
    });
  }

  /**
   * 选定适配器
   */
  selectAdapter(value: any) {
    console.log('set adapter', value);
    const configItem: BizService.AdapterConfig | undefined = this.adapters.find((item: BizService.AdapterConfig) => item.code === value);
    if (configItem) {
      this.authlist = configItem.config.authList;
      this.configs.commonlist = configItem.config.commonList.map((param: any) => {
        param.value = '';
        return param;
      });
      if (!this.IsDatabaseAdapter) {
        // 非数据库适配器，默认选中自定义授权方式
        this.selectAuth('customer');
      } else {
        // 数据库适配器无授权字段，只有公共字段
        this.configs.auth = {
          code: '',
          name: '',
          parameterlist: []
        }
        if (!Array.isArray(this.databaseOptions) || !this.databaseOptions.length) {
          this.getSqlConnections();
        }
      }
    }
  }
  /**
   * 选定授权方式
   */
  selectAuth(value: any) {
    // console.log('set auth', value);
    const authItem: BizService.AuthItem | undefined = this.authlist.find((item: BizService.AuthItem) => item.code === value);
    if (authItem) {
      this.configs.auth = Object.assign({}, {
        ...authItem,
        parameterlist: authItem.parameterlist
          ? authItem.parameterlist.map((param: any) => {
            param.value = '';
            return param;
          })
          : []
      });
    }
  }
  /**
   * 选定数据库连接
   * @param sqlCode
   */
  selectSql(sqlCode: string) {
    this.configs.commonlist.forEach((param: any) => param.value = sqlCode);
  }
  /**
   * 校验表单填写内容
   */
  validateForm() {
    return new Promise((resolve, reject) => {
      let hasError: boolean = false;
      const inputs: any[] = this.$vnode.componentInstance
        ? this.$vnode.componentInstance.$children.filter((el: any) => el.$el.className.includes('form-input'))
        : [];
      inputs.forEach((node: any) => {
        const unValidated: boolean = node.validateValue({ target: { value: node.content } });
        if (unValidated) {
          hasError = true;
        }
      });
      if (hasError) {
        reject(new Error('validate failed'));
      } else {
        resolve();
      }
    });
  }

  /**
   * 保存
   */
  save() {
    this.validateForm()
      .then(() => {
        if (!this.form.adapterCode) {
          return this.$message.error('请选择适配器');
        }
        if (this.IsDatabaseAdapter && !this.form.sqlConnectCode) {
          return this.$message.error('请选择数据库连接');
        }
        if (!this.IsDatabaseAdapter && !this.configs.auth.code) {
          return this.$message.error('请选择授权方式');
        }

        this.form.serviceCategoryId = this.categoryId;
        this.form.configJson = JSON.stringify(this.configs);

        // 如果是私享，则清空用户列表
        if (!this.form.shared) {
          this.form.userIdList = [];
        }

        if (this.server.id) {
          const args: BizService.Service.UpdateParams = {
            id: this.server.id,
            ...this.form
          };
          this.updateService(args).then((res: any) => {
            if (!res.errcode) {
              this.$message.success('更新服务成功');
              this.$emit('close');
            } else {
              this.$message.error(res.errmsg);
            }
          });
        } else {
          this.createService(this.form).then((res: any) => {
            if (!res.errcode) {
              this.$message.success('添加服务成功');
              this.$emit('close');
            } else if (res.errcode === 500007) {
              this.$message.error('服务编码已存在');
            } else {
              this.$message.error(res.errmsg);
            }
          });
        }
      })
      .catch(() => { });
  }

  mounted() {
    this.getAPPManagers();
    if (this.server.code) {
      Object.keys(this.form).forEach((key: string) => {
        this.$set(this.form, key, this.server[key]);
      });

      if (!this.form.userIdList) {
        this.form.userIdList = [];
      }

      if (this.server.configJson) {
        try {
          this.configs = JSON.parse(this.server.configJson);
          const configItem: BizService.AdapterConfig | undefined = this.adapters.find((item: any) => item.code === this.form.adapterCode);
          if (configItem) {
            console.log('匹配到具体的适配器，设置可选信息');
            if (
              this.IsDatabaseAdapter
              && Array.isArray(this.configs.commonlist)
              && this.configs.commonlist.length
            ) {
              this.form.sqlConnectCode = this.configs.commonlist[0].value;
              this.getSqlConnections();
            } else {
              this.authlist = configItem.config.authList;
            }
          }
        } catch (err) {
          console.log(err);
        }
      }
    }
    this.isEdit = !!this.server.id;
  }
}
</script>
<style lang="less" scoped>
.add-server {
  padding-bottom: 30px;
  &__block {
    &:nth-child(n + 2) {
      &:before {
        content: "";
        display: block;
        margin: 24px 0;
        height: 1px;
        width: 100%;
        background-color: #e8e8e8;
      }
    }
  }
  &__title {
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
  }
  &__item {
    display: flex;
    align-items: center;
    margin-top: 20px;
    color: rgba(0, 0, 0, 0.65);
    &--full {
      > p {
        flex: 1;
        width: auto;
      }
    }
    > span {
      display: inline-block;
      width: 7em;
      margin-right: 5px;
    }
    > p {
      width: 306px;
      line-height: 1;
    }
    /deep/.ant-select,
    /deep/.ant-input {
      width: 100%;
      color: rgba(0, 0, 0, 0.85);
    }
  }
  &__footer {
    position: absolute;
    z-index: 9;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50px;
    line-height: 50px;
    border-top: 1px solid #e8e8e8;
    text-align: center;
    background: #fff;
  }
}
</style>
