<template>
  <div class="addsql-modal">
    <div class="addsql-modal__body">
      <!-- ---------------------------- -->
      <div class="addsql__block">
        <h3 class="block__title">基本信息</h3>
        <div class="block__row">
          <!-- 编码 -->
          <div class="block__item">
            <span class="block__label label-required">编码</span>
            <p class="block__input">
              <template v-if="id">{{ params.code }}</template>
              <form-input
                v-else
                v-model="params.code"
                placeholder="请填写编码，例：BPM_123"
                :rules="rules.code"
              ></form-input>
            </p>
          </div>
          <!-- 显示名称 -->
          <div class="block__item">
            <span class="block__label label-required">显示名称</span>
            <p class="block__input">
              <form-input v-model="params.name" placeholder="请填写名称" :rules="rules.name"></form-input>
            </p>
          </div>
        </div>
        <!-- 描述 -->
        <div class="block__item">
          <span class="block__label">描述</span>
          <p class="block__input">
            <form-input
              v-model="params.description"
              placeholder="请填写描述"
              :textarea="true"
              :validateOnBlur="false"
              :maxLength="200"
              :autosize="{ maxRows: 3, minRows: 3 }"
              :rules="rules.description"
            ></form-input>
          </p>
        </div>
      </div>
      <!-- -------------------------------- -->
      <div class="addsql__block">
        <h3 class="block__title">链接参数</h3>
        <!-- 数据库类型  -->
        <div class="block__item">
          <span class="block__label label-required">数据库类型</span>
          <p class="block__input">
            <a-radio-group
              v-model="params.databaseType"
              :options="databaseTypes"
              @change="setDatabaseType"
            />
          </p>
        </div>
        <!-- jdbcUrl -->
        <div class="block__item">
          <span class="block__label label-required">JDBCURL</span>
          <p class="block__input">
            <form-input v-model="params.jdbcUrl" :rules="rules.jdbcUrl"></form-input>
          </p>
        </div>
        <!-- 用户名 -->
        <div class="block__item">
          <span class="block__label label-required">用户名</span>
          <p class="block__input">
            <form-input v-model="params.username" :rules="rules.username"></form-input>
          </p>
        </div>
        <!-- 密码 -->
        <div class="block__item">
          <span class="block__label label-required">密码</span>
          <p class="block__input">
            <!-- 编辑时默认密码不可改，点击图标可切换 -->
            <template v-if="id">
              <template v-if="!pwdChanged">
                ************
                <i class="icon aufontAll h-icon-all-edit-o" @click="onEditPassword"/>
              </template>
              <template v-else>
                <form-input
                  type="password"
                  class="change-password"
                  v-model="newPwd"
                  :rules="rules.password"
                  placeholder="请输入新的密码"></form-input>
                <i class="icon aufontAll h-icon-all-delete-o" title="取消修改密码" @click="cancelEditPassword"/>
              </template>
            </template>
            <template v-else>
              <form-input type="password" v-model="params.password" :rules="rules.password"></form-input>
            </template>
          </p>
        </div>
      </div>
    </div>
    <div class="addsql-modal__footer">
      <a-button type="primary" @click="onSaveButton">保存</a-button>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

import { utils } from '@cloudpivot/common';

import { pattern, nameValidator } from '@/common/utils';

import * as BizSql from '@/apis/biz-sql/index';

@Component({
  name: "add-sql",
  components: {
    FormInput: () => import('@/components/global/form-input/index.vue')
  }
})
export default class AddSql extends Vue {
  @Prop() value?: any;

  @Prop() databaseTypes!: Array<any>;

  pubKey: string = `MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDWh6U87qYwBNlMflQp74EzHvbgny/nxXauAwMFqTdooFpKvZ0v375iYkP++aOVdjG6foAIlLrt41hcNXQIcjHb51qLbDPAmC0SOXyVmqeERMf1YrhTyJReZSpPAoDt21pqt5MtuYuO+wwuQFRf+5OseFSJz2b229boBfzXs+tuBwIDAQAB`;

  //编辑时则存id
  id: string = '';

  // 是否在编辑时修改密码
  pwdChanged: boolean = false;
  // 编辑时密码必须全新设置，默认置空
  newPwd: string = '';

  // 创建数据库连接参数
  params: BizSql.createParams = {
    code: '',
    name: '',
    description: '',
    databaseType: BizSql.DatabaseType.Mysql,
    jdbcUrl: '',
    username: '',
    password: '',
  }

  // 参数规则
  rules: any = {
    code: [
      {
        required: true,
        message: '请填写编码'
      },
      {
        pattern: pattern('code'),
        message: '以字母开头,包括字母或下划线或数字,不超过28个字符'
      }
    ],
    name: [
      {
        required: true,
        message: '请填写名称'
      },
      {
        validator: nameValidator,
        message: '仅限50个字符以内，并不能以空格开头'
      }
    ],
    description: [
      {
        validator: nameValidator,
        maxLength: 200,
        message: '仅限200个字符以内，并不能以空格开头'
      }
    ],
    username: [
      {
        required: true,
        message: '请填写用户名'
      },
      {
        validator: nameValidator,
        message: '仅限50个字符以内，并不能以空格开头'
      }
    ],
    password: [
      {
        required: true,
        message: '请填写密码'
      },
      {
        validator: nameValidator,
        message: '仅限50个字符以内，并不能以空格开头'
      }
    ],
    jdbcUrl: [
      {
        required: true,
        message: '请填写数据库地址'
      },
      {
        validator: nameValidator,
        maxLength: 200,
        message: '仅限200个字符以内，并不能以空格开头'
      }
    ],
  }

  /**
   * 选中数据库类型
   * NOTE: 预留方法，用于后续新的数据库类型有定制操作时添加
   */
  setDatabaseType(e: any) {
    // console.log(e.target.value);
  }

  /**
   * 表单校验
   */
  validateForm() {
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
      return Promise.reject(new Error('validate failed'));
    }
    return Promise.resolve();
  }

  /**
   * 点击保存按钮
   */
  onSaveButton() {
    this.validateForm().then(this.submit).catch((err: any) => {
      this.$message.warning('填写内容有误，请修改后提交！')
      console.error(err);
    })
  }

  /**
   * 提交数据到接口
   */
  submit() {
    // console.log('params:', this.params);
    // console.log('payload value:', this.value);

    const id = this.value ? this.value.id : null;

    if (id && typeof id === 'string') {
      this.updatePool(id);
    } else {
      this.createPool();
    }
  }

  /**
   * 创建数据库连接
   */
  createPool() {
    // 将密码加密后传送密文给后台
    const secretPwd: string = utils.RsaEncrypt(this.params.password, this.pubKey);
    // 提交
    BizSql.createBizSql({
      ...this.params,
      password: secretPwd
    }).then((res: Common.Data) => {
      // console.log('create result: ', res);
      if (res.errcode === 0 && res.data) {
        // console.log('result', res.data);
        this.$emit('success', res.data);
      } else {
        if (res.errcode === 502002) {
          this.$message.error('编码不能重复');
        } else {
          this.$message.error(res.errmsg);
        }
      }
    })
  }

  /**
   * 更新数据库连接
   */
  updatePool(id: string) {
    const updateParams: BizSql.updateParams = {
      id,
      ...this.params
    }
    // 如密码有修改，则将新密码加密后传送密文给后台
    if (this.pwdChanged) {
      const secretPwd: string = utils.RsaEncrypt(this.newPwd, this.pubKey);
      updateParams.password = secretPwd;
    }
    // 提交
    BizSql.updateBizSql(updateParams)
      .then((res: Common.Data) => {
        // console.log('update result:', res);
        if (res.errcode === 0 && res.data) {
          // console.log('result', res.data);
          this.$emit('success', res.data);
        } else {
          this.$message.error(res.errmsg);
        }

      })
  }

  /**
   * 编辑时触发修改密码
   */
  onEditPassword() {
    this.newPwd = '';
    this.pwdChanged = true;
  }

  /**
   * 编辑时取消修改密码
   */
  cancelEditPassword() {
    this.newPwd = '';
    this.pwdChanged = false;
  }

  /**
   * 编辑时初始化参数值
   */
  setParams() {
    if (this.value && typeof this.value === 'object') {
      this.id = this.value.id;
      Object.keys(this.params).forEach((key: string) => {
        this.$set(this.params, key, this.value[key])
      })
    }
  }

  mounted() {
    this.setParams();
  }
}
</script>
<style lang="less" scoped>
.addsql-modal {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  &__body {
    flex: 1;
    width: 100%;
    padding: 24px;
    overflow-y: auto;
  }
  &__footer {
    flex: none;
    width: 100%;
    height: 50px;
    line-height: 50px;
    border-top: 1px solid #e8e8e8;
    text-align: center;
    background: #fff;
  }
  .addsql__block {
    &:nth-child(n + 2):before {
      content: "";
      display: block;
      margin: 24px 0;
      height: 1px;
      width: 100%;
      background-color: #e8e8e8;
    }
  }
  .block__ {
    &row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    &title {
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
    }
    &item {
      display: flex;
      align-items: center;
      margin-top: 20px;
      color: rgba(0, 0, 0, 0.65);
      > p {
        flex: 1;
        min-width: 306px;
        line-height: 1;
        width: auto;
      }
      > span {
        display: inline-block;
        width: 5em;
        margin-right: 5px;
      }
      i {
        cursor: pointer;
      }
      /deep/.ant-input {
        width: 100%;
        color: rgba(0, 0, 0, 0.85);
      }
    }
  }
  .change-password {
    width: calc(100% - 30px);
    display: inline-block;
    &+i {
      display: inline-block;
      vertical-align: middle;
      margin-left: 8px;
    }
  }
}
</style>