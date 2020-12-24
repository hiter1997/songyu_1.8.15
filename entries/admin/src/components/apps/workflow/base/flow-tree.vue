<template>
  <div class="flow-tree">
    <a-tree-select
      showSearch
      :treeData="sourceData"
      dropdownClassName="flow-tree-dropdown fixed"
      :dropdownStyle="{'width': treeWidth ? `${treeWidth}px`: 'inherit'}"
      :loadData="loadTreeData"
      @focus="setTreeWidth"
      @select="onSelect"
      @search="onSearch"
      v-model="treeValue"
      treeNodeFilterProp="title"
    ></a-tree-select>
    <div class="select-empty-content" slot="notFoundContent">暂无数据</div>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';

import { workflowCenterApi } from '@cloudpivot/api'

import AppCenter from '@/apis/apps';

import WorkflowCenter from '@/apis/workflow';

interface TreeNode {
  type: string,          // 类型，区分应用，目录，流程等
  label: string,         // 标签，展示的文案
  title: string,         // 过滤节点的属性
  icon: string,          // 标签前面的图标
  value: string,         // 当前节点的值
  isLeaf: boolean,       // 是否是叶子
  selectable: boolean,   // 是否可选
  children: Array<any>   // 子节点，树枝
}

enum LeafTypes {
  App = 'App',            // 应用
  BizModel = "BizModel",  // 模型
  Folder = "Folder",      // 目录
  Workflow = "Workflow"   // 流程 
}

@Component({
  name: 'FlowTree',
  components: {
  }
})

export default class FlowTree extends Vue {

  /**
   * Todo:
   * 1. 支持搜索 需要新增一个搜索接口
   * 2. 支持选择模型 需要新增一个接口，查找当前模型所属位置
   * */

  @Prop({ default: () => ['Workflow'] })
  readonly leafs !: Array<string>;

  @Prop()
  readonly value !: string;


  // 展示用
  treeValue: string = 'Loading...'

  // 下拉树的源数据
  sourceData: Array<TreeNode> = [];

  // 首次加载时的所有模型源数据
  allTreeData: Array<TreeNode> = [];

  isSelected: boolean = false;

  // 当前节点在树中的位置
  private nodePos: Array<number> = [];

  // 当前所选模型的
  private schemaCode: string = '';

  // 搜索模型的定时任务
  searchTask: any = null;
  // 搜索模型的关键字
  searchText: string = '';

  treeWidth:number = 0;

  mounted() {
    this.init();
  }


  /**
   * 初始化
   * */
  async init() {
    await this.initTree();
    this.treeValue = this.value;
    this.searchText = '';

  }

  setTreeWidth() {
    // 组件更新导致样式问题，现做临时样式处理方案
    const flowTree = document.querySelector('.flow-tree') as HTMLElement;
    if (flowTree) {
      this.treeWidth = flowTree.clientWidth;
    }
  }


  /**
   * 初始化树
  */
  private async initTree() {
    // 获取所有应用列表
    const appsResult: any = await AppCenter.getAppList();
    if (appsResult.errcode !== 0) throw new Error('获取应用列表失败');

    // 抹平数据差异,因为这个接口返回的数据里面没有code属性
    appsResult.data.forEach((item: any) => {
      item.type = LeafTypes.App;
    });
    // 生成一级树
    const appsTree: Array<TreeNode> = this.treeDataGenerator(appsResult.data) as Array<TreeNode>;

    this.setTree(appsTree);


    // 数据回写
    if (this.value) {
      await this.markFlow(this.value);
    }
  }

  /**
   * 标注当前选中的节点
   */
  async markFlow(propValue: string) {
    if (!propValue) return;
    // 获取当前流程的目录结构 [appCode, code, code]
    const path: Array<string> = await this.getFlowPath(propValue) as Array<string>;
    if (!Array.isArray(path) || path.length < 2) {
      return;
    }
    const pathLength = path.length;
    // 清空节点定位信息
    this.nodePos = [];

    // 回写二(三)级树
    const appCode: string = path[0];
    await this.getFolderOrBizModels(appCode);

    // 回写流程的位置
    let appIndex: number = -1;
    const appItem: TreeNode|undefined = this.sourceData.find((item: TreeNode, idx: number) => {
      if (item.value === appCode) {
        appIndex = idx;
        return true
      }
      return false
    });
    if (appIndex < 0) {
      return;
    }
    this.nodePos.push(appIndex);

    if (!appItem || !appItem.children || !appItem.children.length) {
      return;
    }

    // 根据路径长度判断当前流程有多少级目录
    // 长度等于2, 说明结构为 App-BizModel
    // 长度等于3, 说明结构为 App-Folder-BizModel
    // 即，按照结构类型赋值nodePos、取最后一个值获取流程
    const schemaCode: string = path[pathLength - 1];

    // this.schemaCode = schemaCode; // 在选择的时候赋值

    if (pathLength === 2) {
      const bizModelIndex: number = appItem.children.findIndex((item: TreeNode) => item.value === schemaCode);
      // 获取目录结构接口没有返回目录这层，故做临时处理
      const bizPos: number = Math.max(bizModelIndex, 0);
      this.nodePos.push(bizPos);
    } else if (pathLength === 3) {
      // 先存目录位置
      const folderCode: string = path[1];
      let folderIndex: number = -1;
      const folderItem: TreeNode|undefined = appItem.children.find((item: TreeNode, idx: number) => {
        if (item.value === folderCode) {
          folderIndex = idx;
          return true
        }
        return false
      });
      if (folderIndex < 0) {
        this.nodePos.push(0);
        return;
      }
      this.nodePos.push(folderIndex);

      if (!folderItem || !folderItem.children || !folderItem.children.length) {
        return;
      }
      // 再存模型位置
      const bizModelIndex: number = folderItem.children.findIndex((item: TreeNode) => item.value === schemaCode);
      this.nodePos.push(bizModelIndex);
    }

    await this.getWorkflowList(schemaCode);
  }

  /**
   * 树形数据懒加载
  */
  private async loadTreeData(node: any) {
    if (this.searchText) { return };
    const { value, type } = node.$vnode.data.props as any;
    this.onExpand(node);
    if (type === LeafTypes.App) { // 是应用，即获取目录或者模型
      this.getFolderOrBizModels(value);
    } else if (type === LeafTypes.BizModel) { // 是数据模型，即获取流程列表
      this.getWorkflowList(value);
    }

  }

  /**
   * 请求应用下面的一级，有可能是目录，也有可能是模型
   * 所以这个方法会生成二级树或者三级树：app-folder-bizModel 或 app-model
   * @param code 应用编码
  */
  private async getFolderOrBizModels(code: string) {
    if (!code) throw new Error('应用编码不能为空');

    const result: any = await AppCenter.getAppItem({ appCode: code });

    if (result.errcode !== 0) throw new Error('获取目录或模型失败');

    // 生成二(三)级树
    const tree = this.treeDataGenerator(result.data) as Array<TreeNode>


    // 添加回源树中
    const curAppTreeIndex: number = this.sourceData.findIndex((d: TreeNode) => d.value === code) as number;

    if (curAppTreeIndex <= -1) throw new Error('没有找到对应的应用');

    const temTree: Array<TreeNode> = JSON.parse(JSON.stringify(this.sourceData));

    temTree[curAppTreeIndex].children = tree;

    if (this.sourceData[curAppTreeIndex].children.length <= 0) {
      this.setTree(temTree);
    }
  }


  /**
   * 获取模型下面的流程列表
   * */
  private async getWorkflowList(schemaCode: string) {
    if (!schemaCode) throw new Error('模型编码不能为空');

    // 设置模型编码，以返回出去，后续逻辑需要使用
    // this.schemaCode = schemaCode;  // 在选择流程的时候的时候赋值

    const result: any = await WorkflowCenter.getWorkflowList({ schemaCode });

    if (result.errcode !== 0) throw new Error('获取流程列表失败');

    // 抹平数据差异,因为这个接口返回的数据里面没有code属性而使用workflowCode
    // 同时因为流程编码可能与模型编码或者其他编码重复，所以需要加一个前缀'workflow-'以区分
    // 增加type、name属性
    result.data.forEach((item: any) => {
      item.code = `workflow-${item.workflowCode}`;
      item.type = LeafTypes.Workflow;
      item.name = item.workflowName;
    })

    const workflowList: Array<any> = result.data.filter((item: any) => item.published);

    // 生成最深层树
    const tree = this.treeDataGenerator(workflowList) as Array<TreeNode>;

    // 添加回源树中
    const temTree: Array<TreeNode> = JSON.parse(JSON.stringify(this.sourceData));
    const indexs: Array<number> = this.nodePos;

    if (indexs.length === 2) {
      temTree[indexs[0]].children[indexs[1]].children = tree;
    } else if (indexs.length === 3) {
      temTree[indexs[0]].children[indexs[1]].children[indexs[2]].children = tree;
    }

    this.setTree(temTree);
  }


  /**
   * 通过流程编码获取其父级目录结构
   * */
  private async getFlowPath(workflowCode: string) {
    if (!workflowCode) return;
    const params: any = { workflowCode: workflowCode.split('-')[1] };
    const result: any = await WorkflowCenter.getParentByWorkflowCode(params);
    if (result.errcode !== 0) throw new Error('获取流程父级目录失败');

    const pathArray: Array<string> = result.data.split('-') as Array<string>;

    return pathArray;
  }


  // 获取节点
  private getNode(tree: Array<TreeNode>, indexs: Array<number>) {
    let node: any = [];
    let count: number = 0;
    while (count < indexs.length) {
      node = tree[indexs[count]].children;
      count++;
    }
    return node;
  }


  /**
   * 设置树源数据
   * @param 源数据
  */
  private setTree(treeData) {
    if (!treeData) return;

    this.sourceData = treeData;
    this.allTreeData = treeData;
  }


  /**
   * 树展开
   * */
  private onExpand(nodeAttr: any) {
    if (!nodeAttr.expanded) { // 节点展开
      const arr: Array<any> = nodeAttr.pos.split('-');
      arr.shift();
      arr.forEach((item: any) => {
        item = parseInt(item, 10);
      })
      this.nodePos = arr as Array<number>;
    }
  }


  /**
   * 选中的时候
  */
  private async onSelect(value: any, vNode:any) {
    this.$emit('input', value);
    this.treeValue = value;

    const { nodePos } = this; 
    
    // 描述： 模型编码赋值逻辑改成在选择流程的时候根据接口去获取，因为做了搜索之后，赋值的逻辑也要跟着变
    // By John 20200310
    const res:any = await this.getFlowPath(value)
    if (res) {
      const path:any = res;
      const pathLength:any = res.length;
      let schemaCode:any = path[pathLength - 1];
      this.$emit('select', { schemaCode });
    } else {
      console.error(res);
    }
  
  }

  /**
   * 重置下拉树为默认数据
   */
  resetInitiedTree() {
    this.sourceData = this.allTreeData;
    this.nodePos = [];
    if (this.treeValue) {
      this.markFlow(this.treeValue);
    }
  }

  /**
   * 搜索树
   */
  onSearch(text: string) {
    console.log('onSearch:', text);
    this.searchText = text;
    clearTimeout(this.searchTask);
    if (!text) {
      this.resetInitiedTree();
      return;
    }
    this.searchTask = setTimeout(() => {
      this.doSearch(text);
    }, 300);
  }
  /**
   * 执行模型搜索 
   */
  doSearch(text: string) {
    console.log('doSearch:', text);

    /*接口数据结构：
      // const source = {
      //   "appCode": null,
      //   "appName": null,
      //   "name_i18n": null,
      //   "size": 2,
      //   "dataList": null,
      //   "appList": [
      //     {
      //       "appCode": "zhg2",
      //       "appName": "F00_line | 关联模型",
      //       "name_i18n": "{\"en\":\"F00_line\"} | {\"en\":\"关联模型\"}",
      //       "size": null,
      //       "dataList": [
      //         {
      //           "id": "2c928e496dca72bf016dd466a7391909",
      //           "appCode": "",
      //           "schemaCode": "relativeform1015",
      //           "code": "workflowdd",
      //           "name": "发起流程",
      //           "name_i18n": "{\"en\":\"发起流程\"}",
      //           "icon": "h-icon-all-logic",
      //           "type": "BizModel",
      //           "favorites": false,
      //           "size": 0
      //         }
      //       ],
      //       "appList": null
      //     }
      //   ]
      // };
    */
    const vm: any = this;
    workflowCenterApi.searchMyWorkflowList({
      workflowName: text,
      language: this.$i18n.locale,
      isMobile: false
    }).then((res: any) => {
      if (res.errcode !== 0) {
        vm.sourceData = [];
        return;
      }

      if (res.data && Array.isArray(res.data.appList)) {
        const tree = this.translateWorkflowToTree(res.data.appList);
        console.log('formatedTree:', tree);
        vm.sourceData = tree;
      } else {
        vm.sourceData = [];
      }
    });
  }

  /**
   * 将搜索到的流程结果转化为树形下拉格式
   */
  translateWorkflowToTree(data: any) {
    if (!data || !data.length) {
      return [];
    }
    const { leafs } = this;
    const iconPrefix: string = 'icon aufontAll ';
    let tree: Array<TreeNode> = [];
    data.forEach((item: any) => {
      const [appname, schemaname] = item.appName.split(' | ');

      const node: TreeNode = {
        label: appname,
        title: appname,
        icon: iconPrefix + 'h-icon-all-folder-o',
        type: LeafTypes.App,
        value: item.appCode,
        selectable: false,
        isLeaf: false,
        children: []
      };

      if (item.dataList && item.dataList.length) {
        const schemaNode: TreeNode = {
          label: schemaname,
          title: schemaname,
          icon: iconPrefix + 'h-icon-all-folder-o',
          type: LeafTypes.BizModel,
          value: item.dataList[0].schemaCode,
          selectable: false,
          isLeaf: false,
          children: []
        }
        schemaNode.children = item.dataList.map((child: any) => {
          const nodeChild: TreeNode = {
            label: child.name,
            title: child.name,
            icon: iconPrefix + child.icon,
            type: LeafTypes.Workflow,
            value: 'workflow-' + child.code,
            selectable: true,
            isLeaf: true,
            children: []
          };
          return nodeChild;
        });
        node.children.push(schemaNode);
      };

      tree.push(node);
    });
    // 将相同的appcode项合并
    let combineTree: Array<TreeNode> = [];
    tree.forEach((node: TreeNode) => {
      const existNode = combineTree.find((nod: TreeNode) => nod.value === node.value);
      if (existNode) {
        existNode.children.push(...node.children)
      } else {
        combineTree.push(node);
      }
    });
    // console.log(combineTree);
    return combineTree;
  }


  /** 
  * 树数据生成器
  * @param data 源数据
  * @param type 区分当前数据是应用、目录、模型、流程
  */
  private treeDataGenerator(data: any) {
    if (!data || data.length <= 0) return [];
    const { leafs } = this;
    const iconPrefix: string = 'icon aufontAll ';
    let tree: Array<TreeNode> = [];
    data.forEach((item: any) => {
      const { type } = item;
      const icon: string = item.icon ? iconPrefix + item.icon : iconPrefix + 'h-icon-all-folder-o';
      const disabled: boolean = !leafs.includes(type);
      let children: Array<TreeNode> = [];

      if (item.children && item.children.length > 0) {
        children = this.treeDataGenerator(item.children) as Array<any>;
      }
      const node: TreeNode = {
        label: item.name,
        title: item.name,
        icon,
        type,
        value: item.code,
        selectable: !disabled,
        isLeaf: !disabled,
        children
      }
      tree.push(node)
    });
    return tree;
  }
} 
</script>

<style lang="less">
.flow-tree {
  width: 100%;
  height: 32px;
}
.flow-tree-dropdown {
  max-height: 45vh !important;
  height: 350px;
  overflow: auto;
  li.ant-select-tree-treenode-disabled > span:not(.ant-select-tree-switcher),
  li.ant-select-tree-treenode-disabled > .ant-select-tree-node-content-wrapper,
  li.ant-select-tree-treenode-disabled
    > .ant-select-tree-node-content-wrapper
    span {
    color: rgba(0, 0, 0, 0.65) !important;
    user-select: none;
  }
  .ant-select-dropdown-content {
    padding-top: 36px;
  }
  .ant-select-tree {
    padding-top: 0!important;
  }
}
.select-empty-content{
  margin: 8px 0;
  text-align: center;
}
</style>