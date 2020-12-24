<template>
  <!-- <div class="biz-rule-list"> -->
  <div class="biz-rule-list">
    <div class="form clearfix">
      <div class="btn-group">
        <a-dropdown>
          <a-button
            class="btn"
            type="primary"
          >
            <i class="icon aufontAll h-icon-all-plus-o"></i>
            {{ $t('languages.Apps.AddNew') }}
          </a-button>
          <a-menu slot="overlay">
            <a-menu-item @click="opBizDesign('dataOperation', true)">
              <div> 数据操作 </div>
            </a-menu-item>
            <a-menu-item @click="opBizDesign('regularOperation', true)">
              <div> 定时作业 </div>
            </a-menu-item>
            
          </a-menu>

        </a-dropdown>

      </div>
    </div>
    <div class="table">
      <a-table
        :columns="columns"
        size="small"
        :pagination="false"
        :loading="false"
        :scroll="{ y: 500 }"
        :dataSource="dataSource"
        id="dataitem"
      >
        <span slot="indexTitle">{{ $t('languages.NO') }}</span>
        <span
          slot="codeTitle"
          class="resize"
        >规则编码</span>
        <span
          slot="nameTitle"
          class="resize"
        >规则名称</span>
        <span
          slot="bizRuleTypeTitle"
          class="resize"
        >规则类型</span>
        <span
          slot="actionTitle"
          class="resize"
        >{{ $t('languages.Apps.Action') }}</span>
        <!-- 数据插槽 -->
        <!-- <p
          slot="index"
          slot-scope="text, record"
          v-if="!record.defaultProperty"
        >
          {{ text }}
        </p>
        <p
          slot="code"
          class="text-ellipsis"
          slot-scope="text, record"
          v-if="!record.defaultProperty"
          :title="text"
        >
          <span v-hight-light="{'keyWords': keyWords, 'value': text }">
          </span>
        </p>
        <p
          slot="name"
          class="text-ellipsis"
          slot-scope="text, record"
          v-if="!record.defaultProperty"
        >
          <span v-hight-light="{'keyWords': keyWords, 'value': text }">
          </span>
        </p> -->
        <span
          slot="bizRuleType"
          slot-scope="text,record"
        >
          <template v-if="text === 0">
            数据操作
          </template>
          <template v-if="text === 1">
            获取集合
          </template>
          <template v-if="text === 2">
            定时任务
          </template>
          <!-- {{ text }} -->
        </span>
        <span
          class="action right"
          slot="action"
          slot-scope="text,record"
        >
          <i class="icon aufontAll h-icon-all-edit-o" @click="opBizDesign(record.id, false)"></i>
          <i class="icon aufontAll h-icon-all-delete-o" @click="deleteItem(record)" v-if="!record.defaultRule"></i>
        </span> 
      </a-table>
    </div>
  </div>
  <!-- </div> -->
</template>
<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';

import  { bizpropertyApi } from '@cloudpivot/api';

@Component({
  name: 'biz-rule-list',
  components: {
  }
  })
export default class BizRuleList extends Vue {
  dataSource = [];
  // 表格配置
  columns:Array<Common.TableHead>= [
    {
      dataIndex: 'index',
      slots: { title: 'indexTitle' },
      scopedSlots: { customRender: 'index' },
      width: 100,
      key: 'index',
      align: 'center',
    },
    {
      dataIndex: 'code',
      key: 'code',
      slots: { title: 'codeTitle' },
      scopedSlots: {
        customRender: 'code'
      },
      align: 'left',
      width: 300
    },
    {
      dataIndex: 'name',
      slots: { title: 'nameTitle' },
      scopedSlots: {
        customRender: 'name'
      },
      key: 'name',
      align: 'left',
      width: 250
    },
    {
      dataIndex: 'bizRuleType',
      slots: { title: 'bizRuleTypeTitle' },
      scopedSlots: { customRender: 'bizRuleType' },
      key: 'bizRuleType',
      align: 'left'
    },
    {
      dataIndex: 'action',
      slots: { title: 'actionTitle' },
      scopedSlots: { customRender: 'action' },
      width: 120,
      key: 'action',
      align: 'right',
    }
  ];

  created() {
    this.loadData();
  }

  loadData() {
    const params = {
      schemaCode: this.schemaCode
    };
    bizpropertyApi.listBySchemacode(params).then(res => {
      if (res.errcode === 0) {
        this.dataSource = res.data.map((item, index) => {
          return {
            index: index + 1,
            ...item
          }
        });
      }
      
    })
  }

  opBizDesign(code:string, edit:boolean) {
    this.$router.push({
      name: "biz-rule",
      params: { bizRuleCode: code },
      query: {isEdit: `${edit}`}
    }).catch((err: any) => {err})
  }

  deleteItem(items:any) {

    const vm:any = this;
    // const { published } = e;
    // const content = published ? this.$t('languages.Apps.DeleteTipsContent') : '';
    const params = {
      id: items.id
    }
    vm.$confirm({
      title: '确定删除该业务规则么？',
      content: '',
      okText: this.$t('languages.Ok').toString(),
      cancelText: this.$t('languages.Cancel').toString(),
      onOk() {
        bizpropertyApi.businessruleDelete(params).then(res => {
          if (res.errcode === 0) {
            vm.$message.success('删除成功！');
            vm.loadData();
          } else {
            vm.$message.error(res.errmsg);
          }
        })
      }
    });
    
    
    

  }

  get schemaCode() {
    return this.$route.params.bizSchemaCode;
  }
}
</script>
<style lang="less" scoped>
  .biz-rule-list {
    margin: 0 24px;
    .form {
      margin: 16px 0;
      .btn-group {
        float: right;
        .btn {
          .icon{
            margin-right: 9px;
          }
        }
      }
    }
    .action {
      .h-icon-all-delete-o {
        margin-left: 18px;
      }
    }
    .table {
      /deep/.ant-table {
        border: 0;
        border-bottom: 1px solid #e8e8e8;
      }
      /deep/.ant-table-body {
        max-height: calc(100vh - 218px)!important;
      }
      /deep/.ant-table-thead {
          tr{
            background: #FAFAFA;
            th {
              & > div {
                font-weight: 600;
                color:rgba(0, 0, 0, 0.85);
                border-right: 1px solid #E8E8E8;
              }
              &:last-child{
                & > div {
                   border-right: 0;
                }
              }
            }
          }
        }
    }
  }
</style>
