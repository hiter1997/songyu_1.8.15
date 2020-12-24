// 初始化表单组件配置
import "@/config/h3-form";

import { Component, Vue, Prop, Provide } from "vue-property-decorator";

import { Collapse, Icon, Alert } from "@h3/antd-vue";

import { schema, renderer, runtime } from "@cloudpivot/form";

import {
  textDataItemOperators,
  numberDataItemOperators,
  logicDataItemOperators,
  DataItem,
  DateItemOperatorType,
  sequenceStatusOperators,
  staffDataItemOperators,
  relevanceFormDataItemOperators
} from "@cloudpivot/form/src/common/data-item/data-item2";

import {
  DataitemConditionItem,
  DataitemConditionValue
} from "@cloudpivot/form/src/common/data-item/typings";

import { ControlHelper } from "@cloudpivot/form/src/common/controls/control-helper";

import * as pcForm from "@cloudpivot/form/pc";

import { formApi, workflowApi, workflow, externalLinkApi, listApi } from "@cloudpivot/api";

import flow from "@cloudpivot/flow/pc";

// import { replaceValueData } from '@cloudpivot/common/src/utils/utils';

import common from "@cloudpivot/common";

import commentComps from "@cloudpivot/form-comment";

const { replaceValueData } = common.utils.BusinessFunctions;

import { recursionSearch, zeroFormat } from "@cloudpivot/common/src/utils/utils";

import FormDetailHeader from "./form-detail-header.vue";

import * as Common from "@/typings/common";

import env from "@/config/env";

import site from "@/config/site";
import * as platform from "@cloudpivot/platform";
// import {FormActionButton, FormAction} from "@cloudpivot/form/src/runtime";

import GenerateHtml from "@cloudpivot/list/src/components/pc/GenerateHtmlForm.vue";
import TempPrintHtml from "@cloudpivot/list/src/components/pc/TempPrintHTMLForm.vue";

@Component({
  name: "pc-form-detail",
  components: {
    AIcon: Icon,
    ACollapse: Collapse,
    ACollapsePanel: Collapse.Panel,
    AAlert: Alert,
    FormDetailHeader,
    WorkflowInfo: flow.components.WorkflowInfo,
    FormActionModal: pcForm.runtime.FormActionModal,
    Approval: flow.components.Approval,
    PcFormRenderer: pcForm.renderer.FormRenderer,
    FormActions: pcForm.runtime.FormActions,
    pcComment: commentComps.pcComment,
    // GenerateHtml: () => import("./generateHTML.vue")
    GenerateHtml,
    TempPrintHtml
  },

  beforeRouteEnter(to, from, next) {
    next(vm => {
      (vm as PcFormDetail).clean();
      (vm as PcFormDetail).beforeLoad();
    });
  },

  beforeRouteUpdate(to, from, next) {
    const vm = this as PcFormDetail;
    vm.clean();
    next();
    vm.beforeLoad();
  }
})
export default class PcFormDetail extends pcForm.runtime.FormDetail {
  showBacktop = false;

  draftAttributesJson: any[][] = [];
  formdata: any = null;
  isShow: boolean = false; // 是否有打印模板
  pdfAble: boolean = false; // 是否开启打印模板
  showPdf: boolean = false;
  pdfUrl: string = `/pdfjs/web/viewer.html`;
  showAlertWarn = false;
  timer: any = null;
  finishTime: string = "";
  srcdoc: string = "";

  isShowComment: boolean = true; // 是否显示评论模块
  tempPrintEleArray: any[] = []; // 不确定高度 需临时打印元素集合
  tempPrintPageSettings: any = "";
  isPrintGenerateHtml = false;

  pageSettings: any = {
    eleType: "pageSettings",
    direction: 1,
    _papersize: {
      id: 1,
      scale: "A4",
      widthTomm: 210,
      heightTomm: 297,
      widthTopx: "595",
      heightTopx: "842"
    },
    _pagemargin: {
      UpTomm: 20,
      DownTomm: 20,
      LeftTomm: 17,
      RightTomm: 17,
      UpTopx: 57,
      DownTopx: 57,
      LeftTopx: 48,
      RightTopx: 48
    },
    _headerfooter: {
      header: {
        marginTopTomm: 10,
        marginTopTopx: 28,
        align: "",
        items: { key: [], value: [] }
      },
      footer: {
        marginTopTomm: 10,
        marginTopTopx: 28,
        align: "",
        items: { key: [], value: [] }
      }
    },
    bgImg: {
      uid: "",
      name: "",
      status: "",
      url: ""
    },
    isPrintBgImg: false
  };

  @Provide()
  layoutTypeFn() {
    return this.formObj && this.formObj.bizSheet && this.formObj.bizSheet.layoutType === "vertical";
  }

  get borderMode() {
    return this.formObj && this.formObj.bizSheet && this.formObj.bizSheet.borderMode === "open";
  }

  get completed() {
    return (
      this.formObj &&
      this.formObj.bizObject &&
      this.formObj.bizObject.sequenceStatus === "COMPLETED"
    );
  }

  get canceled() {
    return (
      this.formObj && this.formObj.bizObject && this.formObj.bizObject.sequenceStatus === "CANCELED"
    );
  }

  /**
   * 评论模块需要判断当前表单是否提交过
   */
  get isSsubmited() {
    if (this.isWorkflowForm) {
      return !!this.formObj.workflowInstanceIsSubmit;
    }

    if (this.formObj.bizObject) {
      return this.formObj.bizObject.data.sequenceStatus === "COMPLETED";
    }

    return false;
  }

  /**
   * 根据表单配置项是否加载评论模块
   */
  get isLoadComment() {
    if (this.formObj.bizSheet && !(window as any).isExternal) {
      return this.formObj.bizSheet.formComment;
    }

    return false;
  }

  // 是否为外部用户
  get isExternal() {
    if ((window as any).isExternal) {
      return true;
    }
    return false;
  }

  // mounted() {
  //     // debugger
  //     // this.formObj
  //     const url: any = this.$route.query.return;
  //     const opener = window.opener;
  //     window.onbeforeunload = () => {
  //             opener.postMessage(url, opener.location.href);
  //     };
  // }

  mounted() {
    this.$nextTick(() => {
      this.callPrintWithKeyboard();
    });
    this.$message.config({
      maxCount: 1,
      duration: 3
    });
    // 来自待阅的页面需要发出重载信号
    const { workitemType } = this.$route.query;
    if (workitemType && workitemType === "unreadWorkitem") {
      const url: any = this.$route.query.return;
      window.onbeforeunload = () => {
        opener.postMessage(url, opener.location.href);
      };
    }
  }

  // 监听快捷建调起打印
  // mac metaKey + p 80
  // win ctrlKey + p 80
  callPrintWithKeyboard() {
    const isMac: boolean = window.navigator.userAgent.indexOf("Mac") >= 0;
    document.addEventListener("keydown", (e: any) => {
      const keyCode: number = e.keyCode as number;
      if (isMac) {
        if (e.metaKey && keyCode === 80) {
          this.hideCommentBeforePrint();
        }
      } else {
        if (e.ctrlKey && keyCode === 80) {
          this.hideCommentBeforePrint();
        }
      }
    });
  }

  /**
   * 让收起按钮始终可见
   * */

  makeRetractShow() {
    const formWrap: HTMLDivElement = document.querySelector(".form-wrap") as HTMLDivElement;
    const retractDom: HTMLDivElement = document.querySelector(".retract") as HTMLDivElement;
    if (!retractDom) return;
    formWrap.addEventListener("scroll", (e: any) => {
      const st: number = formWrap.scrollTop as number;
      (retractDom.style as any).top = `${st + 3}px`;
    });
  }

  // 页面销毁的时候
  destroyed() {
    clearInterval(this.timer);
  }

  onBodyScroll(evt: Event) {
    const formBody = evt.target as HTMLDivElement;
    this.showBacktop = formBody.scrollTop > 0;
  }

  @Provide()
  getScrollEl() {
    return this.$el.querySelector(".form-wrap") as HTMLDivElement;
  }

  backTop() {
    const formBody = this.getScrollEl();
    if (formBody) {
      formBody.scrollTop = 0;
    }
  }

  showMessage() {
    const h3Messsag = this.$refs.h3Messsag as any;
    return h3Messsag.show();
  }

  get $message() {
    return Vue.prototype.$message;
  }

  get $confirm() {
    return Vue.prototype.$confirm;
  }

  get getFileUrlFn() {
    return renderer.UploadControl.service.getDownloadUrl;
  }

  clean(excludeNode?: boolean) {
    super.clean(excludeNode);
    this.showBacktop = false;
  }

  get dataItems() {
    if (this.formObj.bizSchema && this.formObj.bizSchema.properties) {
      return this.formObj.bizSchema.properties;
    }

    return [];
  }

  async beforeLoad() {
    if (this.isWorkFlow) {
      this.nodes = await (this.getWorkFlowNodes() as any);
      this.nodes.forEach((res, index) => {
        if (index === 0) {
          res.selected = true;
        } else {
          res.selected = false;
        }
      });
      if (this.nodes.length > 0) {
        this.getNodesParams(this.nodes[0].activityCode);
      }
      this.load();
    } else {
      this.load();
    }
  }

  nodesSwitch(node: string) {
    this.getNodesParams(node);
    this.clean(true);
    this.load();
  }

  async load(edit?: boolean) {
    let closeLoading;
    if (!window.Environment.isIe) {
      closeLoading = this.$message.loading(null, 0);
    }
    try {
      const res = await super.load(edit);

      this.loadSheetColumnWidth();

      if (this.formObj) {
        let {
          creater: { name }
        } = this.formObj.bizObject;

        // 附件上传者因为当前表单操作者
        const operater = window.sessionStorage.getItem("user");
        operater ? (name = JSON.parse(operater).name) : name;
        window.sessionStorage.setItem("uploadName", name);
        const title = this.formObj.instanceName || this.formObj.bizSheet.name;
        document.title = `${site.title}-${title}`;
      }

      this.$nextTick(() => {
        this.makeRetractShow();
      });
    } catch (e) {
      console.log(e);
      if (e.errcode === 601010 || e.errcode === 6000018) {
        this.goPermission();
        return;
      }

      if (
        e.errcode === 302034 ||
        (this.formObj &&
          this.formObj.bizSheet &&
          this.formObj.bizSheet.publishedAttributesJson === null)
      ) {
        // this.showAlertWarn = true;
        this.goUnpublished();
        return;
      }

      const noData =
        this.formObj && this.formObj.bizObject ? this.formObj.bizObject.loadedFromDb : true;
      if (e.errcode === 402500 || !noData) {
        setTimeout(() => {
          this.$message.error("数据已被删除。");
        }, 50);
      }

      this.goEmptyPage();
      return;
    } finally {
      if (closeLoading) {
        closeLoading();
      }
    }
  }

  getSheetStorageKey(sheet: schema.FormSheet) {
    return `${this.formObj.bizSchema.code}-${this.formObj.bizSheet.code}-${sheet.key}`;
  }

  onSheetColumnResize(data: {
    sheet: schema.FormSheet;
    column: schema.FormSheetColumn;
    width: number;
  }) {
    const key = this.getSheetStorageKey(data.sheet);
    let json = localStorage.getItem(key);

    let widthMap: any;
    if (json) {
      try {
        widthMap = JSON.parse(json);
      } catch (error) {}
    }

    if (!widthMap) {
      widthMap = {};
    }

    widthMap[data.column.key] = data.width;

    json = JSON.stringify(widthMap);
    localStorage.setItem(key, json);
  }

  loadSheetColumnWidth() {
    const formControls: schema.RendererFormControl[] = [];
    renderer.components.FormRendererHelper.findFormControl(this.controls, formControls);

    const sheets = formControls.filter(
      c =>
        c.type === schema.FormControlType.Sheet &&
        ((c as any) as schema.FormSheet).columns.length > 0
    );

    for (const s of sheets) {
      const sheet = (s as any) as schema.FormSheet;
      const key = this.getSheetStorageKey(sheet);
      const json = localStorage.getItem(key);
      if (!json) {
        continue;
      }

      try {
        const widthMap = JSON.parse(json);

        if (!widthMap) {
          continue;
        }

        for (const col of sheet.columns) {
          const w = widthMap[col.key];
          if (w) {
            col.width = w;
          }
        }
      } catch {}
    }
  }

  initIframe(url: string) {
    const iframe = super.initIframe(url);
    const w = iframe.contentWindow as any;
    w.env = env;
    w.config = env;
    return iframe;
  }

  onOk(ac: runtime.FormActionButton, data: any) {
    // 删除保存在sessionStorage中的值，防止错误填充审批衣间
    window.sessionStorage.removeItem("$approval");
    super.doAction(ac, data);
  }

  async onAction(ac: runtime.FormActionButton) {
    // if (ac.code === runtime.FormAction.Reject && !this.validateApproval()) {
    //     return;
    // }
    if (ac.code === runtime.FormAction.Print) {
      this.hideCommentBeforePrint();
    }
    console.log("ac", ac);
    await super.onAction(ac);
  }

  async goto(ac: runtime.FormActionButton, res: Common.Data) {
    this.judgeIfNeedReload(ac);
    // debugger;
    let url = this.$route.query.return as string;
    const params: any = this.$route.query;

    const reload = () => {
      const workitem = res.data.workItem;
      if (workitem) {
        this.goWfForm(workitem.id, workitem.instanceId);
      } else if (params.workitemId && params.workflowInstanceId) {
        this.goWfForm(params.workitemId, params.workflowInstanceId);
      } else {
        this.goBizForm();
      }
    };
    if (this.isDingTalk) {
      // alert('return =>' + url);
      // alert('fullUrl =>' + window.location.href);
      if (ac.code === runtime.FormAction.Save) {
        reload();
      } else {
        // 列表页面参数不能丢弃。丢弃后无法活动活跃模型
        if (url.indexOf("application-list") > -1) {
          this.$router.push({
            path: url
          }).catch((err: any) => {err});
          return;
        }
        if (url.indexOf("agentId") === -1) {
          url = url.split("?")[0];
        }
        this.$router.push({
          path: url
        }).catch((err: any) => {err});
      }
      return;
    }

    // // debugger
    // // 非流程表单
    // if (!this.isWorkflowForm) {
    //     if (ac.code === runtime.FormAction.Save) {
    //         this.goBizForm();
    //     } else if (
    //         ac.code === runtime.FormAction.Submit ||
    //         ac.code === runtime.FormAction.Delete
    //     ) {
    //         this.goSuccessPage(res);
    //     }
    //     return;
    // }

    // const gotoNext = async () => {
    //     const fromUnfinished = url && url.indexOf("my-unfinished-workitem") > -1;
    //     if (fromUnfinished) {
    //         const item = await this.getFirstUnfinish();
    //         if (item) {
    //             await this.showMessage();
    //             this.goWfForm(item.id, item.instanceId, true);
    //             return;
    //         }
    //     }

    //     this.goSuccessPage();
    // };

    switch (ac.code) {
      case runtime.FormAction.Save:
      case runtime.FormAction.Assist:
      case runtime.FormAction.Circulate:
      case runtime.FormAction.AdjustParticipant:
        reload();
        break;

      case runtime.FormAction.Retrieve:
        const workflowInstanceId = this.$route.query.workflowInstanceId as string;
        this.goWfForm(res.data.id as string, workflowInstanceId, true);
        // this.retrieveCallBack();
        break;

      default:
        // gotoNext();
        this.goSuccessPage(res);
        break;
    }
  }

  goBizForm() {
    const url = this.$route.query.return as string;
    const objectId = this.$route.query.objectId as string;
    this.$router.replace({
      name: "form-detail",
      query: {
        schemaCode: this.formObj.bizSchema.code,
        sheetCode: this.formObj.bizSheet.code,
        objectId: this.formObj.bizObject.id || objectId, // 外部数据源没有对应的id
        return: url,
        t: new Date().getSeconds().toString() || ""
      }
    });
  }

  goWfForm(workitemId: string, workflowInstanceId: string, reload?: boolean) {
    const url = this.$route.query.return as string;
    const params = {
      name: "form-detail",
      query: {
        workitemId,
        workflowInstanceId,
        return: url,
        t: new Date().getSeconds().toString() || ""
      }
    };

    if (reload) {
      const { href } = this.$router.resolve(params);
      window.location.href = href;
    } else {
      this.workflowInstanceId = "";
      setTimeout(() => {
        this.$router.push(params).catch((err: any) => {err});
      }, 0);
    }
  }

  goEmptyPage() {
    this.$router.push({
      name: "shared-empty"
    }).catch((err: any) => {err});
  }

  goUnpublished() {
    this.$router.push({
      name: "formUnpublished"
    }).catch((err: any) => {err});
  }

  goPermission() {
    this.$router.push({
      name: "permission"
    }).catch((err: any) => {err});
  }

  goSuccessPage(backData?: any) {
    if ((window as any).externalLinkToken && backData) {
      const { formCode, objectId, schemaCode, workflowInstanceId } = backData.data;
      let param: any = {
        formCode,
        objectId,
        schemaCode
      };
      if ((window as any).isStartWorkflow) {
        param = { objectId, workflowInstanceId };
      }
      externalLinkApi.getShortCode(param).then((res: any) => {
        if (res.errcode === 0) {
          this.$router.push({
            name: "shared-success",
            params: { shortCode: res.data.pairCode }
          }).catch((err: any) => {err});
        }
      });
    } else {
      const msg = this.$t("languages.form.operateDone").toString();
      this.$message.success(msg, 2, () => window.close());
      // this.$router.push({
      //     name: "shared-success"
      // });
    }
  }

  flowTrack() {
    if (!this.formObj || !this.formObj.workItemId) {
      return;
    }

    const { href } = this.$router.resolve({
      name: "flowTrack",
      params: {
        workItemId: this.formObj.workItemId,
        workflowInstanceId: this.workflowInstanceId
      },
      query: {
        return: this.$route.query.return,
        objectId: this.formObj.bizObject.id,
        schemaCode: this.formObj.bizObject.schemaCode || ""
      }
    });
    window.open(href, "_self");
  }

  setFinishTime(time: any) {
    if (time) {
      this.finishTime = time;
    }
  }

  async getFirstUnfinish() {
    const res = await workflowApi.searchWorkitems({
      wd: "",
      page: 0,
      size: 1
    });

    if (res.errcode === 0 && res.data.totalElements > 0) {
      return res.data.content[0];
    }

    return null;
  }

  onDownload(file: any) {
    if (!file || !file.refId) {
      return;
    }

    const url = renderer.UploadControl.service.getDownloadUrl(file);
    window.open(url);
  }

  print(ac: runtime.FormActionButton) {
    if (!this.formObj.bizSheet.pdfAble) {
      this.pdfAble = false;
    } else {
      this.pdfAble = this.formObj.bizSheet.pdfAble.includes("true");
    }
    // @ts-ignore
    if (!this.formObj.bizSheet.printTemplateJson || !this.pdfAble) {
      // 默认打印
      this.doPrint(ac);
    } else {
      // 已设置打印模板
      this.isShow = !this.isShow;
    }
  }

  doPrint(ac: runtime.FormActionButton) {
    if (platform.IS_DINGTALK) {
      this.$confirm({
        title: this.$t("languages.form.printConfirmTitle").toString(),
        content: this.$t("languages.form.printConfirmContent").toString(),
        okText: this.$t("languages.form.go").toString(),
        onOk() {
          let url = location.href + "&access_token=" + localStorage.getItem("token");
          // window.open(url);
          platform.service.openLink(url);
        }
      });
    } else {
      super.print(ac);
    }
  }

  collectorTempPrintContainer: any = {
    _num: 0
  };
  _findPrintEleIndex(id) {
    for (let i = 0; i < this.draftAttributesJson.length; i++) {
      let page = this.draftAttributesJson[i];
      for (let l = 0; l < page.length; l++) {
        if (page[l].id === id) {
          return [i, l];
        }
      }
    }
    return [-1, -1];
  }
  // 临时打印元素 返回的计算结果
  collectorTempPrintInfo({ id, calcDiff, ...other }) {
    if (!("_num" in this.collectorTempPrintContainer)) {
      this.collectorTempPrintContainer._num = 0;
    }
    console.log("id =>", id);
    console.log("calcDiff =>", calcDiff);
    let [pIndex, sIndex] = this._findPrintEleIndex(id);
    if (!this.collectorTempPrintContainer[pIndex]) {
      this.collectorTempPrintContainer[pIndex] = {};
    }
    this.collectorTempPrintContainer[pIndex][sIndex] = { id, calcDiff, ...other };
    ++this.collectorTempPrintContainer._num;
    console.log(this.collectorTempPrintContainer);
    if (this.collectorTempPrintContainer._num === this.tempPrintEleNumber) {
      delete this.collectorTempPrintContainer._num;
      this.tempPrintEleArray = [];
      this.tempPrintEleNumber = 0;
      this.$nextTick(() => {
        this.printPageAlgorithm();
      });
    }
  }
  printPageAlgorithm() {
    let pageIndex = Object.keys(this.collectorTempPrintContainer);
    console.log(pageIndex);
    for (let page of pageIndex) {
      let eleList: any = Object.keys(this.collectorTempPrintContainer[page]);
      for (let eleIndex of eleList) {
        let eleInfo = this.collectorTempPrintContainer[page][eleIndex];
        if (!eleInfo.calcDiff) {
          // 实际高度没有超过默认高度 不用处理
          continue;
        }
        let [pIndex, sIndex] = this._findPrintEleIndex(eleInfo.id); // 根据id获取元素当前位置, 因为在for中会操作draftAttributesJson
        let ele = this.draftAttributesJson[pIndex][sIndex];
        let eleContentWidth = "";
        let eleMinWidth = "";
        let eleMaxWidth = "";
        let eleDefaultBottomHeight = ele.top + ele.heightValue;
        let newPageNum = 0; // ele 分页数量
        let eleBottomToTop = 0; // ele 不分页情况下, 最低部距离页头距离
        let lastPageHeight = 0; // ele分页,最后一页占用的高度
        if (ele.top + eleInfo.eleContentHeight + eleInfo.pageUpToPx > eleInfo.PageHeightPx) {
          newPageNum = Math.ceil(
            Math.abs(
              eleInfo.eleContentHeight - (eleInfo.PageHeightPx - ele.top - eleInfo.pageUpToPx)
            ) /
              (eleInfo.pageContentHeight -
                (eleInfo.sheetHeaderPagingAttr ? eleInfo.headerHeight : 0))
          );
          lastPageHeight = Math.ceil(
            eleInfo.eleContentHeight -
              (eleInfo.PageHeightPx - ele.top - eleInfo.pageUpToPx) -
              (newPageNum - 1) *
                (eleInfo.pageContentHeight -
                  (eleInfo.sheetHeaderPagingAttr ? eleInfo.headerHeight : 0))
          );
        } else {
          eleBottomToTop = ele.top + eleInfo.eleContentHeight;
        }
        if (ele.eleType === "column") {
          eleContentWidth = ele.leftKey.widthValue + ele.rightValue.widthValue;
          eleMinWidth = ele.left;
          eleMaxWidth = ele.left + eleContentWidth;
        } else if (ele.eleType === "sheet") {
          eleContentWidth = ele.widthValue;
          eleMinWidth = ele.left;
          eleMaxWidth = ele.left + eleContentWidth;
        }
        let eleSibling: any = [];
        let eleSiblingIndex: number[] = [];
        let passivity_eleSibling: any = []; // 被动 分页的元素. 计算元素自己没有分页,但因为它的高度增加使用空间,导致它下面的元素出现分页情况.
        let passivity_eleSiblingIndex: any = []; // 被动 分页的元素的坐标
        let passivity_newPageNum: any = 0; // 被动 分页的元素.产生的分页数量. 理论上只会是1或0
        let _widthValueEleType = ["leftBarcodePic", "leftQrcodePic", "sheet"];
        // 获取那些元素在 变化高度元素下面.
        if (this.draftAttributesJson[pIndex].length > sIndex + 1) {
          let l = this.draftAttributesJson[pIndex].length;
          for (let i = sIndex + 1; i < l; i++) {
            let tItem = this.draftAttributesJson[pIndex][i];
            if (tItem.eleType === "pageSettings") continue;
            let tItemContentWidth: any = "";
            if (
              tItem.eleType === "column" ||
              (tItem.leftKey &&
                (tItem.leftKey.widthValue || tItem.leftKey.widthValue == "0") &&
                tItem.rightValue &&
                (tItem.rightValue.widthValue || tItem.rightValue.widthValue == "0"))
            ) {
              tItemContentWidth = tItem.leftKey.widthValue + tItem.rightValue.widthValue;
            } else if (_widthValueEleType.includes(tItem.eleType)) {
              tItemContentWidth = tItem.widthValue;
            }
            let diffTop = tItem.top - ele.top - ele.heightValue;
            if (
              !(tItem.left + tItemContentWidth <= eleMinWidth || tItem.left >= eleMaxWidth) ||
              diffTop >= 0
            ) {
              // 如果 元素和 下面的元素在 X轴有交集 或 所以在它下放的元素,即使没有X轴交集
              if (newPageNum) {
                // 如果元素会自己分页. 最后一个页的占用的高度加上两个元素 高度差
                tItem.top = lastPageHeight + diffTop;
              } else {
                // 元素自己不分页
                tItem.top = diffTop + eleBottomToTop;
                if (tItem.top > eleInfo.PageHeightPx) {
                  tItem.top = tItem.top - eleInfo.PageHeightPx;
                  passivity_eleSiblingIndex.push(i);
                  passivity_newPageNum = 1;
                }
              }
              console.log(diffTop, tItem.top);
              eleSiblingIndex.push(i);
            }
          }
          console.log("eleSiblingIndex", eleSiblingIndex);
          // 如果元素自己分页,则需要将当前也下面的元素移除掉
          if (eleSiblingIndex.length && newPageNum) {
            for (let i = 0; i < eleSiblingIndex.length; i++) {
              let [s] = this.draftAttributesJson[pIndex].splice(eleSiblingIndex[i] - i, 1);
              eleSibling.push(s);
            }
          } else if (passivity_eleSiblingIndex.length && passivity_newPageNum) {
            for (let i = 0; i < passivity_eleSiblingIndex.length; i++) {
              let [s] = this.draftAttributesJson[pIndex].splice(
                passivity_eleSiblingIndex[i] - i,
                1
              );
              passivity_eleSibling.push(s);
            }
          }
        }
        console.log("eleInfo => ", eleInfo);
        console.log("ele =>", ele);
        console.log("eleSibling =>", eleSibling);
        console.log(`this.draftAttributesJson[${pIndex}]`, this.draftAttributesJson[pIndex]);
        let tempPage: any = [];
        for (let i = 0; i < newPageNum; i++) {
          tempPage.push([]);
        }
        if (newPageNum) {
          // 元素自己会分页情况
          if (eleSibling.length) {
            // 需要移动的元素
            tempPage[tempPage.length - 1] = [...eleSibling];
          }
          this.draftAttributesJson.splice(pIndex + 1, 0, ...tempPage);
        } else {
          // 元素自己不分页的情况
          if (passivity_newPageNum && passivity_eleSiblingIndex.length) {
            for (let i = 0; i < passivity_newPageNum; i++) {
              tempPage.push([]);
            }
            tempPage[tempPage.length - 1] = [...passivity_eleSibling];
            this.draftAttributesJson.splice(pIndex + 1, 0, ...tempPage);
          }
        }
      }
    }
    console.log("finished  => this.draftAttributesJson", this.draftAttributesJson);
    this._startPrintHtml();
  }

  tempPrintEleNumber = 0; // 临时打印元素数量
  printHtmlCloseLoading: any = "";
  async getChildPrintClick(str: string) {
    this.isShow = false;

    const ac = this.actions.find(a => a.code === runtime.FormAction.Print);
    if (str.includes("系统默认模板")) {
      if (ac) {
        this.doPrint(ac);
      }
    } else if (str.includes("打印模板")) {
      this.printHtmlCloseLoading = (this.$message as any).loading("", 0);
      this.showPdf = false;
      this.pdfUrl = `/pdfjs/web/viewer.html`;
      this.formdata = this.formObj;

      const sheetCode: string = JSON.parse(this.formObj.bizSheet.printTemplateJson)[0].sheetCode;

      const schemaCode: string = this.formObj.bizSheet.schemaCode;
      const { data, errcode, errmsg } = await formApi.getPrintAttributesJson({
        sheetCode,
        schemaCode
      });
      if (errcode !== 0) {
        this.$message.error(errmsg, 3);
        return;
      }
      if (!data.draftAttributesJson || !JSON.parse(data.draftAttributesJson).length) {
        this.$message.warning("打印模板内容为空！", 3);
        return;
      }
      console.log("pageSettings => ", this.tempPrintPageSettings);
      // @ts-ignore
      this.draftAttributesJson = replaceValueData(
        env,
        JSON.parse(data.draftAttributesJson) || [],
        "real",
        this
      );
      findPageSettingInfo: for (let pages of this.draftAttributesJson) {
        for (let item of pages) {
          if (item.eleType === "pageSettings") {
            item.top = -999;
            this.tempPrintPageSettings = item;
            break findPageSettingInfo;
          }
        }
      }
      // 为了兼容老数据，pageSettings需要给默认值
      this.tempPrintPageSettings === ""
        ? (this.tempPrintPageSettings = this.pageSettings)
        : this.tempPrintPageSettings;
      for (let page of this.draftAttributesJson) {
        page.sort((a, b) => a.top - b.top);
      }
      console.log("this.draftAttributesJson =>", this.draftAttributesJson);
      const publishedAttributesJson = this.formObj.bizSheet.publishedAttributesJson;
      let publishObjJSON = null;
      if (publishedAttributesJson) {
        publishObjJSON = JSON.parse(publishedAttributesJson);
      }
      const formDataVal: any = this.formObj.bizObject.data;
      for (const page of this.draftAttributesJson) {
        for (let ii = page.length - 1; ii >= 0; ii--) {
          let y = page[ii];
          let isCheckVisible = this.checkVisible(y, publishObjJSON, formDataVal);
          if (!isCheckVisible) {
            page.splice(ii, 1);
          }
          if (y.eleType !== "sheet") continue;
          const value = this.formObj.bizObject.data[y.code];
          if (value && value.length > 0) {
            const valueCopy = JSON.parse(JSON.stringify(value));

            const controls = this.formRenderer.findFormControls([y.code]);
            if (controls && controls.length > 0) {
              const control = (controls[0] as any) as schema.FormSheet;
              if (control) {
                const map: any = {};
                control.columns.map(c => (map[c.key] = c));

                for (const row of valueCopy) {
                  for (const key of Object.keys(row)) {
                    if (map[key]) {
                      if (
                        map[key].type !== schema.FormControlType.Attachment &&
                        map[key].type !== schema.FormControlType.Image &&
                        map[key].type !== schema.FormControlType.RelevanceForm &&
                        map[key].type !== schema.FormControlType.Signature
                      ) {
                        row[key] = renderer.FormControlValueService.format(map[key], row[key]);
                      } else {
                        if (map[key].type === schema.FormControlType.RelevanceForm) {
                          let str: any = "";

                          row[key] && row[key][row[key]["displayCode"]]
                            ? (str = row[key][row[key]["displayCode"]])
                            : str;
                          // 逻辑
                          if (row[key] && row[key].propertyType === 4) {
                            str === true ? (str = "是") : (str = "否");
                          }

                          // 地址处理
                          if (row[key] && row[key].propertyType === 10 && str) {
                            let obj = JSON.parse(str);
                            if (
                              obj &&
                              (obj.hasOwnProperty("provinceName") ||
                                obj.hasOwnProperty("cityName") ||
                                obj.hasOwnProperty("districtName") ||
                                obj.hasOwnProperty("address"))
                            ) {
                              // @ts-ignore
                              str = `${obj.provinceName || ""}${obj.cityName ||
                                ""}${obj.districtName || ""}${obj.address || ""}`;
                            }
                          }
                          // 选人控件处理
                          if (row[key] && row[key].propertyType === 5 && str) {
                            let arrStr: string = "";
                            str.map((arr: any) => {
                              arrStr === "" ? (arrStr = arr.name) : (arrStr += `、` + arr.name);
                            });
                            str = arrStr;
                          }

                          switch (str) {
                            case "DRAFT":
                              str = "草稿";
                              break;
                            case "PROCESSING":
                              str = "进行中";
                              break;
                            case "COMPLETED":
                              str = "已完成";
                              break;
                            case "CANCELED":
                              str = "已作废";
                              break;
                          }
                          row[key] = str.toString();
                        }
                        // 手写签名
                        else if (map[key].type === schema.FormControlType.Signature) {
                          let signature: any = {};
                          Array.isArray(row[key]) && row[key].length > 0
                            ? (signature = row[key][0])
                            : (signature = []);
                          if (signature && signature.refId) {
                            const url = renderer.UploadControl.service.getDownloadUrl(signature);
                            row[key][0].url = url;
                            row[key][0].type = map[key].type;
                          }
                        } else {
                          row[key].forEach(v => (v.type = map[key].type));
                        }
                      }

                      // 修改当表为‘逻辑’时 对应的值显示
                      if (map[key].key.includes("Logic")) {
                        row[key] = row[key] === "true" ? "是" : "否";
                      }
                    } else {
                      const val = row[key];
                      if (Array.isArray(val)) {
                        row[key] = val
                          .map((v: any) => v.name)
                          .filter(f => !!f)
                          .join(";");
                      } else if (typeof val === "object" && val) {
                        if (val.name) {
                          row[key] = val.name;
                        } else if (val.provinceName && val.cityName) {
                          row[key] = `${val.provinceName} ${val.cityName} ${val.districtName} ${
                            val.address
                          }`;
                        } else if (val.address) {
                          row[key] = val.address;
                        } else {
                          row[key] = "";
                        }
                      }
                    }
                  }
                }
              }
            }
            y.value = valueCopy;
          } else {
            // 如果字表无内容则不打印字表
            page.splice(ii, 1);
          }
        }
      }
      console.log("---------------- fromat this.draftAttributesJson: ", this.draftAttributesJson);
      for (let i = 0; i < this.draftAttributesJson.length; i++) {
        let page = this.draftAttributesJson[i];
        for (let j = 0; j < page.length; j++) {
          let ele = page[j];
          if (ele.eleType === "column" && ele.rightValue && ele.rightValue.code) {
            let code = ele.rightValue.code.split("#_#")[0];
            let [ctrl] = this.formRenderer.findFormControls([code]);
            if (!ctrl) continue;
            if (!!ctrl) {
              ele.ctrlType = ctrl.type;
              ele.ctrlValue = ctrl.value;
            }
            if (ctrl.type === schema.FormControlType.Textarea) {
              ++this.tempPrintEleNumber;
              this.tempPrintEleArray.push({
                tempPrintEle: ele,
                isShowTempPrintHtmlEle: true,
                key: `${code}_${i}_${j}`
              });

              // 兼容富文本打印
              if (
                ctrl.options &&
                ctrl.options.textAreaType &&
                ctrl.options.textAreaType === "current"
              ) {
                ele.rightValue.renderType = "editor";
              }
            } else if (ctrl.type === schema.FormControlType.Image) {
              ++this.tempPrintEleNumber;
              this.tempPrintEleArray.push({
                tempPrintEle: ele,
                isShowTempPrintHtmlEle: true,
                key: `${code}_${i}_${j}`
              });
            } else {
              ++this.tempPrintEleNumber;
              this.tempPrintEleArray.push({
                tempPrintEle: ele,
                isShowTempPrintHtmlEle: true,
                key: `${code}_${i}_${j}`
              });
            }
          } else if (ele.eleType === "sheet") {
            let code = ele.code;
            ++this.tempPrintEleNumber;
            this.tempPrintEleArray.push({
              tempPrintEle: ele,
              isShowTempPrintHtmlEle: true,
              key: `${code}_${i}_${j}`
            });
          }
        }
      }
      console.log("this.tempPrintEleArray =>", this.tempPrintEleArray);
      if (!this.tempPrintEleArray.length) {
        this._startPrintHtml();
      }
    }
  }

  // 开始 html打印部分渲染
  _startPrintHtml() {
    this.isPrintGenerateHtml = true;
    setTimeout(async () => {
      // 延迟等待数据渲染成功，拿到html文件
      await this.waitPrintRender(this.printHtmlCloseLoading);
    }, 2000);
  }

  getDownloadUrl(file: renderer.H3File) {
    return renderer.UploadControl.service.getDownloadUrl(file);
  }

  async waitPrintRender(closeLoadingFn: () => {}) {
    const printRenderer = this.$refs.printRenderer as any;
    if (printRenderer) {
      // isEdage  针对兼容Edage浏览器  Edge浏览器不识别onload 故不会执行调起
      const isEdage: boolean = window.navigator.userAgent.indexOf("Edge") !== -1;
      if (isEdage || !!(window as any).ActiveXObject || "ActiveXObject" in window) {
        // const iframe: any = document.getElementById("pdfFrame");
        // this.$nextTick(() => {
        //   this.srcdoc = printRenderer.getHtml();
        //   console.log(this.srcdoc);
        //   iframe.contentWindow.document.body.innerHTML = this.srcdoc;
        //   iframe.contentWindow.print();
        // });
        const newWindow: any = window.open();
        newWindow.document.write(printRenderer.getHtml());
        newWindow.document.close();
        newWindow.focus();
        newWindow.print();
        newWindow.close();
        closeLoadingFn();
      } else {
        const isTrident: boolean = window.navigator.userAgent.indexOf("Trident") !== -1;
        setTimeout(async () => {
          this.$nextTick(() => {
            this.srcdoc = printRenderer.getHtml();
            console.log("print HTML =>", this.srcdoc);
            const iframe: any = document.getElementById("pdfFrame");
            this.isPrintGenerateHtml = false;
            // let page = window.open('', '_blank');// 打开一个新窗口，用于打印
            // page.document.body.innerHTML = this.srcdoc;// 写入打印页面的内容
            iframe.onload = () => {
              closeLoadingFn();
              setTimeout(() => {
                if (!this.srcdoc) return;
                if (isTrident) {
                  iframe.contentWindow.document.execCommand("print", false, null);
                } else {
                  iframe.contentWindow.print();
                }
                this.srcdoc = "";
              }, 300);
            };
            if (isTrident) {
              iframe.onload();
            }
          });
        }, 1800);
      }
    } else {
      setTimeout(() => {
        this.waitPrintRender(closeLoadingFn);
      }, 500);
    }
  }

  /**
   * 根据操作按钮类型，判断是否需要发出列表重载信号
   * @param ac 操作按钮对象
   */
  judgeIfNeedReload(ac: runtime.FormActionButton) {
    let ifNeedReload: boolean = false;
    switch (ac.code) {
      case runtime.FormAction.Submit:
      case runtime.FormAction.Delete:
      case runtime.FormAction.Agree:
      case runtime.FormAction.DisAgree:
      case runtime.FormAction.Cancel:
      case runtime.FormAction.Forward:
      case runtime.FormAction.FinishInstance:
      case runtime.FormAction.Reject:
      case runtime.FormAction.Retrieve:
        ifNeedReload = true;
        break;

      default:
        break;
    }

    if (!ifNeedReload) {
      return;
    }
    // 定义页签关闭前发出重载信号
    const url: any = this.$route.query.return;
    const opener = window.opener;
    window.onbeforeunload = () => {
      opener.postMessage(url, opener.location.href);
    };
  }

  /**
   * 切换是否展示评论模块
   * */

  toggleComment() {
    this.isShowComment = !this.isShowComment;
  }

  /**
   * 在点击打印前将评论收起
   */
  hideCommentBeforePrint() {
    this.isShowComment = false;
  }

  pxToMM(px: number) {
    return Math.floor((px / 72) * 2.54 * 1000000) / 100000;
  }

  mmToPx(value: number) {
    let inch = value / 25.4;
    return Math.ceil(inch * 72);
  }

  /*
   * 根据控件设置的显示条件是否满足决定是否打印该控件
   */
  checkVisible(ele, publishedJSONObj, formDataVal) {
    let isVisible = true;
    let tplEle: any = null;
    if (ele.eleType === "column" && ele.rightValue && ele.rightValue.code) {
      let code = ele.rightValue.code.split("#_#")[0];
      tplEle = recursionSearch(publishedJSONObj, code);
    } else if (ele.eleType === "sheet") {
      tplEle = recursionSearch(publishedJSONObj, ele.code);
    }
    if (tplEle && tplEle.options) {
      let displayFormula = tplEle.options.displayFormula;
      if (displayFormula) {
        if (displayFormula.indexOf("&&") > -1) {
          // 多个And条件解析 判断isShow
          let andArr: any[] = displayFormula.split("&&");
          return andArr.every(item => {
            return this.checkCondition(item, publishedJSONObj, formDataVal);
          });
        } else if (displayFormula.indexOf("||") > -1) {
          // 多个Or条件解析 判断isVisible
          let orArr: any[] = displayFormula.split("||");
          return orArr.some(item => {
            return this.checkCondition(item, publishedJSONObj, formDataVal);
          });
        } else {
          // 只有一个条件解析 判断isVisible
          return this.checkCondition(displayFormula, publishedJSONObj, formDataVal);
        }
      } else {
        return isVisible;
      }
    }
    return isVisible;
  }

  checkCondition(tplStr: string, publishedJSONObj: any, formDataVal: any) {
    let isCheck = true;
    let factors = tplStr.split(" ");
    if (Array.isArray(factors) && factors.length > 1) {
      let propertyCode = factors[0].substring(1, factors[0].length - 1);
      let propertyVal = recursionSearch(formDataVal, propertyCode);
      let operator = factors[1];
      let val: any = null;
      if (factors.length > 2) {
        val = factors[2];
      }
      let condElement = recursionSearch(publishedJSONObj, propertyCode);
      if (condElement) {
        // 将控件类型映射到非系统数据项类型, 根据factor[1]与操作比较
        let type = ControlHelper.mapToDataItemType(condElement.type);
        let op: any = null;
        switch (type) {
          case schema.DataItemType.Number:
          case schema.DataItemType.Date:
            op = numberDataItemOperators.find(item => {
              return item.label === operator;
            });
            if (op) {
              switch (op.value) {
                case DateItemOperatorType.IsNull:
                  return propertyVal == null;
                case DateItemOperatorType.IsNotNull:
                  return propertyVal != null;
                case DateItemOperatorType.Equal:
                  return propertyVal == val;
                case DateItemOperatorType.NotEqual:
                  return propertyVal != val;
                case DateItemOperatorType.GreaterThan:
                  return propertyVal > val;
                case DateItemOperatorType.GreaterThanOrEqual:
                  return propertyVal >= val;
                case DateItemOperatorType.LessThan:
                  return propertyVal < val;
                case DateItemOperatorType.LessThanOrEqual:
                  return propertyVal <= val;
                default:
                  return false;
              }
            } else {
              return false;
            }

          case schema.DataItemType.Logic:
            op = logicDataItemOperators.find(item => {
              return item.label === operator;
            });
            if (op) {
              switch (op.value) {
                case DateItemOperatorType.Equal:
                  return propertyVal == val;
                default:
                  return false;
              }
            } else {
              return false;
            }

          case schema.DataItemType.ShortText:
          case schema.DataItemType.LongText:
            if (condElement.type === schema.FormControlType.SequenceStatus) {
              op = sequenceStatusOperators.find(item => {
                return item.label === operator;
              });
              if (op) {
                switch (op.value) {
                  case DateItemOperatorType.IsNull:
                    return propertyVal == null;
                  case DateItemOperatorType.IsNotNull:
                    return propertyCode != null;
                  case DateItemOperatorType.Equal:
                    return propertyVal == val;
                  case DateItemOperatorType.NotEqual:
                    return propertyVal != val;
                  default:
                    return false;
                }
              } else {
                return false;
              }
            } else {
              op = textDataItemOperators.find(item => {
                return item.label === operator;
              });
              if (op) {
                switch (op.value) {
                  case DateItemOperatorType.IsNull:
                    return propertyVal == null;
                  case DateItemOperatorType.IsNotNull:
                    return propertyCode != null;
                  case DateItemOperatorType.Equal:
                    return propertyVal == val.substring(1, val.length - 1);
                  case DateItemOperatorType.NotEqual:
                    return propertyVal != val.substring(1, val.length - 1);
                  case DateItemOperatorType.Contains:
                    return propertyVal.indexOf(val) > -1;
                  case DateItemOperatorType.NotEqual:
                    return propertyVal.indexOf(val) === -1;
                  case DateItemOperatorType.In:
                    return val.indexOf(propertyVal) > -1;
                  case DateItemOperatorType.NotIn:
                    return val.indexOf(propertyVal) === -1;
                  default:
                    return false;
                }
              } else {
                return false;
              }
            }

          case schema.DataItemType.StaffSelector:
            op = staffDataItemOperators.find(item => {
              return item.label === operator;
            });
            let valJSONObj = val ? JSON.parse(val) : null;
            if (op) {
              switch (op.value) {
                case DateItemOperatorType.IsNull:
                  return propertyVal == null;
                case DateItemOperatorType.IsNotNull:
                  return propertyVal != null;
                case DateItemOperatorType.Contains:
                case DateItemOperatorType.Have:
                  return propertyVal.every(item => {
                    return (
                      valJSONObj.findIndex(x => {
                        return x.parentId === item.id || x.id === item.id;
                      }) > -1
                    );
                  });
                case DateItemOperatorType.NotContains:
                case DateItemOperatorType.NotHave:
                  return propertyVal.every(item => {
                    return (
                      valJSONObj.findIndex(x => {
                        return x.parentId === item.id || x.id === item.id;
                      }) === -1
                    );
                  });

                case DateItemOperatorType.Of:
                case DateItemOperatorType.In:
                  return propertyVal.every(item => {
                    return (
                      valJSONObj.findIndex(x => {
                        return x.id === item.parentId || x.id === item.id;
                      }) > -1
                    );
                  });
                case DateItemOperatorType.NotOf:
                case DateItemOperatorType.NotIn:
                  return propertyVal.every(item => {
                    return (
                      valJSONObj.findIndex(x => {
                        return x.id === item.parentId || x.id === item.id;
                      }) === -1
                    );
                  });
                default:
                  return false;
              }
            } else {
              return false;
            }

          case schema.DataItemType.RelevanceForm:
            // todo
            return true;
        }
      }
    }
    return isCheck;
  }
}
