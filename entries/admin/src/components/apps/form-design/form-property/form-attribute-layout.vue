<template>
  <div
    class="from-attribute-options"
    v-form-validate="{ trigger: 'validate', success: formValidateSuccess, error: formValidateError }"
  >
    <a-tabs :activeKey="tabKey" @change="tabChange">
      <!-- tab 1 -->
      <a-tab-pane tab="控件属性" key="ControlAttribute">
        <div>
          <a-collapse v-model="activeCollapse">
            <!-- 基础信息 -->
            <a-collapse-panel v-show="baseAttributeColumns.length > 0" header="基础信息" key="base">
              <FormControlAttribute
                :attrKey="'baseAttributeColumns'"
                :controlAttribute="baseAttributeColumns"
              ></FormControlAttribute>
            </a-collapse-panel>
            <!-- 控件属性 -->
            <a-collapse-panel
              v-show="controlAttributeColumns.length > 0"
              header="控件属性"
              key="control"
            >
              <FormControlAttribute
                ref="FormCtrAttr"
                :attrKey="'controlAttributeColumns'"
                :formData="formData"
                :controlAttribute="controlAttributeColumns"
              ></FormControlAttribute>
            </a-collapse-panel>
            <!-- 控件事件 -->
            <a-collapse-panel v-show="scriptAttributeColumns.length > 0" header="控件事件" key="event">
              <FormControlAttribute
                :attrKey="'scriptAttributeColumns'"
                :controlAttribute="scriptAttributeColumns"
              ></FormControlAttribute>
            </a-collapse-panel>
          </a-collapse>
        </div>
      </a-tab-pane>
      <!-- tab 2 -->
      <a-tab-pane tab="表单属性" key="FormAttribute">
        <FormControlAttribute :attrKey="'formColumns'" :controlAttribute="formColumns"></FormControlAttribute>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Prop, Watch, Provide } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { mixins } from "vue-class-component";
import { ObjectPropertyInfo, DataType } from "@cloudpivot/form/typings";
import { formDirective } from "@/directives/form-validate";
import { buildControlOptions } from "@/components/apps/form-design/typings/control-factory";
import FormValidateHandleMixin from "@/minxins/form-validate-handle";
import FormControlAttribute from "./form-attribute-control.vue";
import ControlAttributeMap, {
  ScriptsType,
  formAttributeMap,
  baseAttributeMapOptionsExtend,
  ControlCNNameType
} from "./typings/control-attribute-map";
import ControlAttributeMapOptions from "./typings/control-attribute-map-type";
import {
  ControlAttributeType,
  ControlAttributeOptions
} from "./typings/form-attribute";

import { LanguageTransform } from "@/utils";

import * as ControlFactory from "../typings/control-factory";
import { FormControlType } from "../typings";

const DataModelModule = namespace("Apps/DataModel");
import { getComponentByControlType } from "@cloudpivot/form/utils";
@Component({
  name: "form-attribute",
  components: { FormControlAttribute },
  directives: {
    "form-validate": formDirective
  }
})
export default class FormAttribute extends mixins(FormValidateHandleMixin) {
  tabKey: any = "ControlAttribute"; // 默认tab显示a
  activeCollapse: any[] = ["base", "control", "event"]; // 默认打开的<a-collapse-panel>
  controlType: number = -1; // 当前控件类型
  controlKey: string = ""; // 当前控件ID
  parentKey: string = ""; // 当前控件父ID
  summary: any = {}; // 摘要
  formColumns: any = []; // 表单属性栏
  baseAttributeColumns: any = []; // 基础属性栏
  controlAttributeColumns: any = []; // 控件属性栏
  scriptAttributeColumns: any = []; // 事件属性栏
  attributeColumns: any = []; // 属性栏

  @Prop() formData!: any;
  @Prop({ default: () => ({}) }) allControls!: any;

  // 获取摘要的信息
  @DataModelModule.Mutation("setBizSchemaCode") setBizSchemaCode: any;
  @DataModelModule.State("summaryList") summaryList: any;
  @DataModelModule.Action("getDataItemList") getDataItemList: any;
  @DataModelModule.Action("getSummary") getSummary: any;
  @DataModelModule.Mutation("setSummary") setSummary: any;
  @DataModelModule.State("defaultSummary") defaultSummary: any;
  @DataModelModule.Action("submitSummary") submitSummary: any;
  @DataModelModule.State("dataItemList") dataItemList: any;
  @DataModelModule.Mutation("setDataItemTypeList") setDataItemTypeList: any;

  get getSummaryOptions(): any {
    const summaryOptions: any = { list: [], mode: "tags" };
    this.summaryList.forEach((val: any) => {
      summaryOptions.list.push({ label: val.name, value: val.code });
    });
    return summaryOptions;
  }

  get controlPath() {
    const c = this.allControls.control;
    if (c && c.path) {
      return c.path;
    }
  }

  @Watch("summaryList")
  watchSummaryList() {
    this.setSummaryAttribute();
  }

  @Watch("defaultSummary")
  watchDefaultSummary() {
    this.setSummaryAttribute();
  }

  @Watch("allControls", {
    immediate: true
  })
  watchAllControls(allControls: any) {
    if (!allControls || !allControls.control) {
      this.tabKey = "FormAttribute";
    } else {
      // todo： 这个方法是过度方法，处理部分历史遗留数据的， 需要在运行一段时间知后删除
      allControls.control = this.translatrRowsToString(allControls.control);
      this.tabKey = "ControlAttribute";
      this.controlKey = allControls.control.key;
      this.controlType = allControls.control.type;
      this.parentKey = allControls.control.parentKey;
      this.$nextTick(() => {
        this.baseAttributeColumns = [];
        this.controlAttributeColumns = [];
        this.scriptAttributeColumns = [];
        this.setAttribute(allControls);
      });
    }
  }
  /**
   * @desc 子表的默认行属性为0时，一直提示不能为空，当row必须为string才不会报错
   */
  translatrRowsToString(control) {
    let {
      options: { rows },
      type
    } = control;
    if (type !== 201) return control;
    rows = typeof rows === "string" ? rows : `${rows}`;
    control.options = { ...control.options, rows };
    return control;
  }
  @Watch("formData")
  watchFormData(formData: any) {
    //this.getDataItemList();
    this.$nextTick(() => {
      if (!formData.name) {
        return;
      }
      const lang: string = localStorage.getItem("locale") || "";

      this.formColumns = [];
      const code = Object.assign({}, formAttributeMap.code, {
        field: "code",
        value: formData.code
      });

      let formName = formData.name;

      if (formData.name_i18n) {
        const locales = JSON.parse(formData.name_i18n);
        if (locales[this.$i18n.locale]) {
          formName = locales[this.$i18n.locale];
        }
      }

      const name = Object.assign({}, formAttributeMap.name, {
        field: "name",
        value: formName
      });

      const externalLink = Object.assign(
        {},
        formAttributeMap.externalLinkAble,
        {
          field: "externalLinkAble",
          value: formData.externalLinkAble || false
        }
      );

      const qrCode = Object.assign({}, formAttributeMap.qrCodeAble, {
        field: "qrCodeAble",
        value: formData.qrCodeAble ? formData.qrCodeAble : "open"
      });

      const shortCode = Object.assign({}, formAttributeMap.shortCode, {
        field: "shortCode",
        value: formData.shortCode || ""
      });

      const print = Object.assign({}, formAttributeMap.print, {
        field: "print",
        value: !!formData.printTemplateJson || false
      });

      const pdfAble = Object.assign({}, formAttributeMap.pdfAble, {
        field: "pdfAble",
        value: formData.pdfAble ? formData.pdfAble : "false"
      });

      const layoutType = Object.assign({}, formAttributeMap.layoutType, {
        field: "layoutType",
        value: formData.layoutType ? formData.layoutType : "horizontal"
      });

      const borderMode = Object.assign({}, formAttributeMap.borderMode, {
        field: "borderMode",
        value: formData.borderMode ? formData.borderMode : "close"
      });
      const formComment = Object.assign({}, formAttributeMap.formComment, {
        field: "formComment",
        value: formData.formComment ? !!formData.formComment : false
      });

      const { schemaCode } = formData;
      const formId = Object.assign({}, formAttributeMap.id, {
        field: "sheetData",
        value: {
          id: formData.id,
          schemaCode,
          shortCode: formData.shortCode,
          code: formData.code,
          printTemplateJson: formData.printTemplateJson,
          name: formData.name,
          sheetType: formData.sheetType
        }
      });

      // if ()
      this.formColumns.push(...[code, name]);
      this.formColumns.push(
        this.summary,
        externalLink,
        qrCode,
        formId,
        shortCode,
        print,
        pdfAble,
        layoutType,
        borderMode,
        formComment
      );

      // 设置隐藏字段
      let displayFied: string[] = [];
      this.formColumns.forEach((res: any) => {
        if (res.options && res.options.hideField) {
          displayFied = displayFied.concat(res.options.hideField);
        }
      });

      displayFied.forEach((res: any) => {
        const field: any = this.formColumns.find((attr: any) => {
          return attr.field === res;
        });
        if (field) {
          field.display = false;
        }
      });
    });

    // 监控表单的属性
  }

  @Watch("$i18n.locale")
  onLanguageChange() {
    this.watchFormData(this.formData);
  }

  /**
   * 设置摘要属性
   * */
  setSummaryAttribute() {
    if (this.defaultSummary.length || this.summaryList.length) {
      this.summary = Object.assign(this.summary, {
        field: "summary",
        value: this.defaultSummary,
        options: this.getSummaryOptions
      });
      this.watchFormData(this.formData);
    }
  }

  /**
   * 设置属性栏值
   * @param allControls     控件属性
   */
  setAttribute(allControls: any) {
    const control: any = allControls.control as any;
    const tmpOptions: any = control.options as any;
    const componentAsset: any = getComponentByControlType(+control.type);
    var groups = JSON.parse(JSON.stringify(componentAsset.conduct.groups));
    const type: string = (() => {
      let tmpType = control.type;
      if (tmpType >= 50 && tmpType < 70) {
        tmpType = 50;
      }
      return tmpType.toString();
    })();

    let name = tmpOptions.name;

    if (tmpOptions.name_i18n) {
      const locales = tmpOptions.name_i18n; //JSON.parse(tmpOptions.name_i18n);
      const locale = this.$i18n.locale;
      if (locales[locale]) {
        name = locales[locale];
      }
    }

    let options: any = typeof name === "string" ? { name: name } : {};

    const { dataItem } = allControls;

    if (dataItem) {
      options = Object.assign(options, {
        dataItemName: dataItem.code
        // widgetType: control.type
      });
    }

    options = Object.assign({ defaultValue: "" }, tmpOptions, options);

    if (control.width !== undefined) {
      let sheetAsset: any = getComponentByControlType(FormControlType.Sheet);
      componentAsset.schema.properties.width =
        sheetAsset.schema.properties.width; // 如果是子表内的控件,可以设置列宽
      componentAsset.conduct.properties.width =
        sheetAsset.conduct.properties.width; // 如果是子表内的控件,可以设置列宽
      groups.base.keys = [...groups.base.keys, "width"];
      options.width = control.width === null ? "" : control.width.toString();
    }
    const calcValue = (key, opt, pros) =>
      opt[key] || typeof opt[key] === "boolean"
        ? opt[key]
        : pros[key] && pros[key].value !== undefined
        ? pros[key].value
        : opt[key];
    if (componentAsset) {
      let { conduct, schema } = componentAsset;
      // let { properties } = conduct;
      let properties: any = conduct.properties;
      for (let attributeKey of Object.keys(groups)) {
        let attribute = groups[attributeKey];
        let attributeColumns: any = [];
        for (const key of attribute.keys) {
          let attributeOptions: any;
          let _options = {};
          if (properties && properties[key]) {
            _options = properties[key].options
              ? { ...properties[key].options }
              : {};
            if (properties[key].inputMethod) {
              switch (properties[key].inputMethod) {
                case ControlAttributeType.Modal:
                  attributeOptions = {
                    ...properties[key],
                    modalField: key,
                    ...ControlAttributeMapOptions(
                      ControlAttributeType.Modal,
                      "_"
                    )
                  };
                  // 将 conduct定义的 数据传递给 modal框
                  let modalOptions = Object.keys(properties[key]).filter(
                    k =>
                      !["inputMethod", "inputComponent", "options"].includes(k)
                  );
                  if (modalOptions && modalOptions.length) {
                    attributeOptions["modalOptions"] = {};
                    for (let k of modalOptions) {
                      attributeOptions["modalOptions"][k] = properties[key][k];
                    }
                  }
                  break;
                case ControlAttributeType.Dropdown:
                  attributeOptions = {
                    inputMethod: properties[key].inputMethod
                  };
                  if (properties[key].options && properties[key].options.list) {
                    if (typeof properties[key].options.list === "function") {
                      if (dataItem) {
                        _options["list"] = properties[key].options.list(
                          dataItem.type,
                          dataItem,
                          control
                        );
                      } else {
                        _options["list"] = properties[key].options.list(
                          control
                        );
                      }
                    }
                  } else {
                    if (!properties[key].options.dataList) {
                      console.error(
                        `下拉框属性,必须在options设置 list 或 dataList!`
                      );
                    }
                  }
                  break;
                case ControlAttributeType.SelectTree:
                case ControlAttributeType.Tree:
                  attributeOptions = {
                    ...properties[key],
                    ...ControlAttributeMapOptions(
                      properties[key].inputMethod ||
                        schema.properties[key].type,
                      null
                    )
                  };
                  break;
              }
            } else {
              attributeOptions = ControlAttributeMapOptions(
                properties[key].inputMethod || schema.properties[key].type,
                null
              );
            }
            let _val = calcValue(key, options, properties);
            const cOptions = Object.assign({}, attributeOptions, _options);
            const controlAttribute = Object.assign(
              {},
              schema.properties[key],
              {
                label: schema.properties[key].title,
                type: schema.properties[key].type
              },
              { options: cOptions },
              { value: _val, field: key }
            );
            if (dataItem) {
              controlAttribute.dataItem = dataItem;
              if (key === "schemaCode") {
                if (!controlAttribute.options) {
                  controlAttribute.options = {};
                }
                controlAttribute.options.disabled = dataItem.published;
              }
            }
            attributeColumns.push(controlAttribute);
          } else {
            const controlAttribute: any = Object.assign(
              {},
              { value: options[key], field: key, options: {} },
              {
                label: schema.properties[key].title,
                type: schema.properties[key].type
              }
            );
            if (dataItem) {
              controlAttribute.dataItem = dataItem;
              if (key === "schemaCode") {
                if (!controlAttribute.options) {
                  controlAttribute.options = {};
                }
                controlAttribute.options.disabled = dataItem.published;
              }
            }
            attributeColumns.push(controlAttribute);
          }
        }
        switch (attributeKey) {
          case "base":
            this.baseAttributeColumns = [...attributeColumns];
            break;
          case "controller":
            this.controlAttributeColumns = [...attributeColumns];
            break;
          case "scripts":
            this.scriptAttributeColumns = [...attributeColumns];
            break;
          default:
            console.error(
              "组件conduct.group 的key 应该是 base、controller、scripts"
            );
        }
      }
      // 基础信息 属性
      // if (groups.base) {
      //   let base = groups.base;
      //   for (const key of base.keys) {
      //     let attributeOptions: any;
      //     let baseAttributeExtend: any;
      //     let cOptions: any;
      //     let extendOptions: any;
      //     if (properties && properties[key]) {
      //       let _options = {};
      //       if (properties[key].options) {
      //         for (let pk of Object.keys(properties[key].options as Object)) {
      //           _options[pk] = (properties as any)[key].options[pk];
      //         }
      //       }
      //       if (properties[key].inputMethod) {
      //         switch (properties[key].inputMethod) {
      //           case ControlAttributeType.Modal:
      //             attributeOptions = {
      //               ...properties[key],
      //               modalField: key,
      //               ...ControlAttributeMapOptions(
      //                 ControlAttributeType.Modal,
      //                 "_"
      //               )
      //             };
      //             // 将 conduct定义的 数据传递给 modal框
      //             let modalOptions = Object.keys(properties[key]).filter(
      //               k =>
      //                 !["inputMethod", "inputComponent", "options"].includes(k)
      //             );
      //             if (modalOptions && modalOptions.length) {
      //               attributeOptions["modalOptions"] = {};
      //               for (let k of modalOptions) {
      //                 attributeOptions["modalOptions"][k] = properties[key][k];
      //               }
      //             }
      //             break;
      //           case ControlAttributeType.Dropdown:
      //             attributeOptions = {
      //               inputMethod: properties[key].inputMethod
      //             };
      //             if (properties[key].options && properties[key].options.list) {
      //               if (typeof properties[key].options.list === "function") {
      //                 _options["list"] = properties[key].options.list(
      //                   dataItem.type,
      //                   dataItem,
      //                   control
      //                 );
      //               }
      //             } else {
      //               if (!properties[key].options.dataList) {
      //                 console.error(
      //                   `下拉框属性,必须在options设置 list 或 dataList!`
      //                 );
      //               }
      //             }
      //             break;
      //         }
      //       }
      //       cOptions = Object.assign({}, attributeOptions, _options);
      //     }
      //     let _val = calcValue(key, options, properties);
      //     const baseAttribute: any = Object.assign(
      //       {},
      //       properties && properties[key] ? properties[key] : {},
      //       { options: cOptions || extendOptions || {} },
      //       { value: _val, field: key },
      //       baseAttributeExtend ? baseAttributeExtend[key] : {},
      //       {
      //         label: schema.properties[key].title,
      //         type: schema.properties[key].type
      //       }
      //     );
      //     // if (
      //     //     key === "widgetType" &&
      //     //     baseAttribute.type === DataType.String
      //     //   ) {
      //     //     baseAttribute.value = properties[key].value;
      //     //   }
      //     this.baseAttributeColumns.push(baseAttribute);
      //   }
      // }
      // 控件信息 属性
      // if (groups.controller) {
      //   let controller = groups.controller;
      //   for (const key of controller.keys) {
      //     let attributeOptions: any;
      //     let _options = {};
      //     if (properties && properties[key]) {
      //       _options = properties[key].options
      //         ? { ...properties[key].options }
      //         : {};
      //       if (properties[key].inputMethod) {
      //         switch (properties[key].inputMethod) {
      //           case ControlAttributeType.Modal:
      //             attributeOptions = {
      //               ...properties[key],
      //               modalField: key,
      //               ...ControlAttributeMapOptions(
      //                 ControlAttributeType.Modal,
      //                 "_"
      //               )
      //             };
      //             // 将 conduct定义的 数据传递给 modal框
      //             let modalOptions = Object.keys(properties[key]).filter(
      //               k =>
      //                 !["inputMethod", "inputComponent", "options"].includes(k)
      //             );
      //             if (modalOptions && modalOptions.length) {
      //               attributeOptions["modalOptions"] = {};
      //               for (let k of modalOptions) {
      //                 attributeOptions["modalOptions"][k] = properties[key][k];
      //               }
      //             }
      //             break;
      //           case ControlAttributeType.Dropdown:
      //             attributeOptions = {
      //               inputMethod: properties[key].inputMethod
      //             };
      //             if (properties[key].options && properties[key].options.list) {
      //               if (typeof properties[key].options.list === "function") {
      //                 _options["list"] = properties[key].options.list(
      //                   dataItem.type,
      //                   dataItem,
      //                   control
      //                 );
      //               }
      //             } else {
      //               if (!properties[key].options.dataList) {
      //                 console.error(
      //                   `下拉框属性,必须在options设置 list 或 dataList!`
      //                 );
      //               }
      //             }
      //             break;
      //           case ControlAttributeType.SelectTree:
      //           case ControlAttributeType.Tree:
      //             attributeOptions = {
      //               ...properties[key],
      //               ...ControlAttributeMapOptions(
      //                 properties[key].inputMethod ||
      //                   schema.properties[key].type,
      //                 null
      //               )
      //             };
      //             break;

      //         }
      //       } else {
      //         attributeOptions = ControlAttributeMapOptions(
      //           properties[key].inputMethod || schema.properties[key].type,
      //           null
      //         );
      //       }
      //       let _val = calcValue(key, options, properties);
      //       const cOptions = Object.assign({}, attributeOptions, _options);
      //       const controlAttribute = Object.assign(
      //         {},
      //         schema.properties[key],
      //         {
      //           label: schema.properties[key].title,
      //           type: schema.properties[key].type
      //         },
      //         { options: cOptions },
      //         { value: _val, field: key }
      //       );
      //       if (dataItem) {
      //         controlAttribute.dataItem = dataItem;
      //         if (key === "schemaCode") {
      //           if (!controlAttribute.options) {
      //             controlAttribute.options = {};
      //           }
      //           controlAttribute.options.disabled = dataItem.published;
      //         }
      //       }
      //       this.controlAttributeColumns.push(controlAttribute);
      //     } else {
      //       const controlAttribute: any = Object.assign(
      //         {},
      //         { value: options[key], field: key, options: {} },
      //         {
      //           label: schema.properties[key].title,
      //           type: schema.properties[key].type
      //         }
      //       );
      //       if (dataItem) {
      //         controlAttribute.dataItem = dataItem;
      //         if (key === "schemaCode") {
      //           if (!controlAttribute.options) {
      //             controlAttribute.options = {};
      //           }
      //           controlAttribute.options.disabled = dataItem.published;
      //         }
      //       }
      //       console.log("未设置 conduct", key);
      //       this.controlAttributeColumns.push(controlAttribute);
      //     }
      //   }
      // }
      // if (groups.scripts) {
      //   for (let scripotKey of groups.scripts.keys) {
      //     let attributeOptions: any;
      //     let _options = {};
      //     if (properties && properties[scripotKey]) {
      //       _options = properties[scripotKey].options
      //         ? { ...properties[scripotKey].options }
      //         : {};
      //       if (properties[scripotKey].inputMethod) {
      //         switch (properties[scripotKey].inputMethod) {
      //           case ControlAttributeType.Modal:
      //             attributeOptions = {
      //               ...properties[scripotKey],
      //               modalField: scripotKey,
      //               ...ControlAttributeMapOptions(
      //                 ControlAttributeType.Modal,
      //                 "_"
      //               )
      //             };
      //             // 将 conduct定义的 数据传递给 modal框
      //             let modalOptions = Object.keys(properties[scripotKey]).filter(
      //               k =>
      //                 !["inputMethod", "inputComponent", "options"].includes(k)
      //             );
      //             if (modalOptions && modalOptions.length) {
      //               attributeOptions["modalOptions"] = {};
      //               for (let k of modalOptions) {
      //                 attributeOptions["modalOptions"][k] =
      //                   properties[scripotKey][k];
      //               }
      //             }
      //             break;
      //           case ControlAttributeType.Dropdown:
      //             attributeOptions = {
      //               inputMethod: properties[scripotKey].inputMethod
      //             };
      //             if (
      //               properties[scripotKey].options &&
      //               properties[scripotKey].options.list
      //             ) {
      //               if (
      //                 typeof properties[scripotKey].options.list === "function"
      //               ) {
      //                 _options["list"] = properties[scripotKey].options.list(
      //                   dataItem.type,
      //                   dataItem,
      //                   control
      //                 );
      //               }
      //             } else {
      //               if (!properties[scripotKey].options.dataList) {
      //                 console.error(
      //                   `下拉框属性,必须在options设置 list 或 dataList!`
      //                 );
      //               }
      //             }
      //             break;
      //         }
      //       } else {
      //         attributeOptions = ControlAttributeMapOptions(
      //           properties[scripotKey].inputMethod ||
      //             schema.properties[scripotKey].type,
      //           null
      //         );
      //       }
      //       const cOptions = Object.assign({}, attributeOptions, _options);
      //       let _val = calcValue(scripotKey, options, properties);
      //       const controlAttribute = Object.assign(
      //         {},
      //         schema.properties[scripotKey],
      //         {
      //           label: schema.properties[scripotKey].title,
      //           type: schema.properties[scripotKey].type
      //         },
      //         { options: cOptions },
      //         { value: _val, field: scripotKey }
      //       );
      //       if (dataItem) {
      //         controlAttribute.dataItem = dataItem;
      //         if (scripotKey === "schemaCode") {
      //           if (!controlAttribute.options) {
      //             controlAttribute.options = {};
      //           }
      //           controlAttribute.options.disabled = dataItem.published;
      //         }
      //       }
      //       this.scriptAttributeColumns.push(controlAttribute);
      //     } else {
      //       const controlAttribute: any = Object.assign(
      //         {},
      //         { value: options[scripotKey], field: scripotKey, options: {} },
      //         {
      //           label: schema.properties[scripotKey].title,
      //           type: schema.properties[scripotKey].type
      //         }
      //       );
      //       if (dataItem) {
      //         controlAttribute.dataItem = dataItem;
      //         if (scripotKey === "schemaCode") {
      //           if (!controlAttribute.options) {
      //             controlAttribute.options = {};
      //           }
      //           controlAttribute.options.disabled = dataItem.published;
      //         }
      //       }
      //       console.log("未设置 conduct", scripotKey);
      //       this.scriptAttributeColumns.push(controlAttribute);
      //     }
      //   }
      // }
      this.fieldsOptionsHandle();
    } else {
      if (options) {
        for (const field in options) {
          const key = field as any;
          const controlOptions: any = ControlAttributeMap.Map[type];
          let attributeOptions: any;
          if (controlOptions && controlOptions[key]) {
            attributeOptions = ControlAttributeMapOptions(
              controlOptions[key].type,
              controlOptions[key].attrType
            );
          }
          if (ControlAttributeMap.BaseMap[key]) {
            // const baseAttributeExtend: any = baseAttributeMapOptionsExtend[type];
            let baseAttributeExtend: any;
            if (dataItem && dataItem.type === 1) {
              baseAttributeExtend = baseAttributeMapOptionsExtend["2"];
            } else {
              baseAttributeExtend = baseAttributeMapOptionsExtend[type];
            }
            let cOptions: any;
            let extendOptions: any;

            if (baseAttributeExtend && baseAttributeExtend[key]) {
              extendOptions = ControlAttributeMapOptions(
                baseAttributeExtend[key].type,
                baseAttributeExtend[key].attrType
              );
            } else {
              cOptions = Object.assign(
                {},
                attributeOptions,
                ControlAttributeMap.BaseMap[key].options
              );
            }

            const baseAttribute: any = Object.assign(
              {},
              ControlAttributeMap.BaseMap[key],
              { options: cOptions || extendOptions },
              baseAttributeExtend ? baseAttributeExtend[key] : {},
              { value: options[key], field: key }
            );

            if (
              key === "widgetType" &&
              baseAttribute.type === ControlAttributeType.String
            ) {
              baseAttribute.value = ControlCNNameType[baseAttribute.value];
            }

            if (key === "width") {
              const min = ControlFactory.getSheetColumnWidth(control.type);
              const typeOther = "min";
              const newReg = {
                typeOther,
                regexp: (value: string) => parseFloat(value) >= min,
                message: `不能小于最小宽度${min}`
              };
              const regexps = baseAttribute.options.regexps.regexps;
              let idx = regexps.findIndex((r: any) => r.type === typeOther);
              if (idx > -1) {
                regexps.splice(idx, 1, newReg);
              } else {
                regexps.push(newReg);
              }
            }

            this.baseAttributeColumns.push(baseAttribute);
          } else if (controlOptions && controlOptions[key]) {
            const cOptions = Object.assign(
              {},
              attributeOptions,
              controlOptions[key].options
            );
            const controlAttribute = Object.assign(
              {},
              controlOptions[key],
              { options: cOptions },
              { value: options[key], field: key }
            );
            if (dataItem) {
              controlAttribute.dataItem = dataItem;
              if (key === "schemaCode") {
                if (!controlAttribute.options) {
                  controlAttribute.options = {};
                }
                controlAttribute.options.disabled = dataItem.published;
              }
            }

            const isScript: any = ScriptsType[key];
            if (isScript) {
              this.scriptAttributeColumns.push(controlAttribute);
            } else {
              this.controlAttributeColumns.push(controlAttribute);
            }
          }
        }
        this.fieldsOptionsHandle();
      }
    }
  }

  /**
   * 获取隐藏字段数组
   * @param attr     控件属性
   */
  getHideFields(attr: ControlAttributeOptions) {
    let displayFields: string[] = [];
    if (attr.options) {
      // bool类型的
      if (attr.options.fieldDisplay instanceof Array) {
        displayFields = displayFields.concat(
          attr.value
            ? attr.options.fieldDisplay[0]
            : attr.options.fieldDisplay[1]
        );
      }
      if (attr.options.hideField) {
        // 通用隐藏方法
        const hideFields: Function | string[] = attr.options.hideField;
        displayFields = displayFields.concat(
          hideFields instanceof Function
            ? hideFields(attr.value)
            : hideFields || []
        );
      }
      if (attr.options.transaction) {
        attr.options.transaction({
          attr,
          attrs: this.controlAttributeColumns,
          displayFields,
          allControls: this.allControls
        });
      }
    }
    return displayFields;
  }

  /**
   *  显示字段的过滤
   */
  fieldsOptionsHandle() {
    let displayFields: string[] = [];
    [
      ...this.baseAttributeColumns,
      ...this.controlAttributeColumns,
      ...this.scriptAttributeColumns
      // ...this.formColumns
    ].forEach((attr: any) => {
      displayFields = displayFields.concat(this.getHideFields(attr));
    });

    displayFields = [...new Set(displayFields)];

    displayFields.forEach((field: string) => {
      this.controlAttributeColumns.find((attr: any) => {
        if (attr.field === field) {
          if (!attr.options) {
            attr.options = {};
          }
          attr.display = false;
        }
        return attr.field === field;
      });
    });
  }

  // 页签切换
  tabChange(tabKey: any) {
    if (
      this.baseAttributeColumns.length > 0 ||
      this.controlAttributeColumns.length > 0
    ) {
      this.tabKey = tabKey;
    } else {
      this.$message.info("请先选择控件");
    }
  }

  /**
   * type的回填
   * @param type
   */
  typeAttributeBackfill(type: number) {
    this.$emit(
      "control-update",
      this.controlKey,
      {
        type: Number(type)
      },
      this.parentKey,
      this.controlPath
    );
  }

  /**
   * width的回填
   * @param type
   */
  widthAttributeBackfill(width: number | null) {
    this.$emit(
      "control-update",
      this.controlKey,
      {
        width
      },
      this.parentKey,
      this.controlPath
    );
  }

  /**
   *options的回填
   * @param key
   * @param field
   * @param value
   */
  optionsAttributeBackfill(key: string, field: string, value: any) {
    const options: any = {};
    const attr: any = (this as any)[key].find(
      (item: any) => item.field === field
    );
    // 关联表单显示字段同步到stroe
    if (attr.dataItem && attr.dataItem.type === 9) {
      this.dataItemList.forEach((data: any, index: number) => {
        if (attr.dataItem.parentCode) {
          const sheetData = this.dataItemList[index].children;
          if (sheetData) {
            sheetData.map((d: any, i: number) => {
              if (d.code === attr.dataItem.code) {
                if (field === "displayField") {
                  this.dataItemList[index].children[
                    i
                  ].relativePropertyCode = value;
                }
              }
            });
          }
        } else if (data.code === attr.dataItem.code) {
          if (field === "displayField") {
            this.dataItemList[index].relativePropertyCode = value;
          }
        }
      });
      this.setDataItemTypeList(this.dataItemList);
    }

    options[field] = value;
    attr.value = value;
    if (field === "regexpText") {
      let val = JSON.parse(value);
      if (val.en === "" && val.zh === "") {
        options[field] = "";
        attr.value = "";
      }
    }

    const displayFields: string[] = this.getHideFields(attr);
    if (displayFields.length) {
      displayFields.forEach((item: string) => {
        options[item] = buildControlOptions(this.allControls.control.type)[
          item
        ];
      });
    }
    this.$emit(
      "control-update",
      this.controlKey,
      {
        options
      },
      this.parentKey,
      this.controlPath
    );
  }

  /**
   * 摘要的回填
   * @param summary
   */
  summaryAttributeBackfill(summary: string) {
    this.setSummary(summary.split(","));
    this.submitSummary();
  }

  /**
   * 表单的回填
   * @param field
   * @param value
   */
  formAttributeBackfill(field: string, value: any) {
    this.$emit("edit-formdata-attribute", field, value);
  }

  /**
   * 属性栏值修改
   * @param key        属性控件key
   * @param field       字段的名称
   * @param value       字段的值
   */
  @Provide()
  updateAttribute(key: string, field: string, value: any) {
    this.$nextTick(() => {
      switch (key) {
        case "baseAttributeColumns":
          if (field === "widgetType") {
            this.typeAttributeBackfill(value);
          } else if (field === "width") {
            this.widthAttributeBackfill(!value ? null : Number(value));
          } else {
            this.optionsAttributeBackfill(key, field, value);
          }
          break;
        case "controlAttributeColumns":
        case "scriptAttributeColumns":
          this.optionsAttributeBackfill(key, field, value);
          break;
        case "formColumns":
          if (field === "summary") {
            this.summaryAttributeBackfill(value);
          } else {
            this.formAttributeBackfill(field, value);
          }
          break;
        default:
          console.warn("updateAttribute", key);
          this.optionsAttributeBackfill(key, field, value);
          break;
      }
    });
  }

  @Provide()
  inputAttributeBlur(key: string, field: string, value: any) {
    this.$nextTick(() => {
      if (field === "dataItemName") {
        const options: any = {};
        const attr: any = (this as any)[key].find(
          (item: any) => item.field === field
        );

        options[field] = value;
        attr.value = value;

        const displayFields: string[] = this.getHideFields(attr);
        if (displayFields.length) {
          displayFields.forEach((item: string) => {
            options[item] = buildControlOptions(this.allControls.control.type)[
              item
            ];
          });
        }
        this.$emit(
          "control-update-blur",
          this.controlKey,
          {
            options
          },
          this.parentKey,
          this.controlPath
        );
      }
    });
  }

  /**
   * 属性栏值修改
   * @param key        属性控件key
   * @param field       字段的名称
   * @param callback    方法回到
   */
  @Provide()
  attrCallback(key: string, field: string, callback: Function) {
    const cols: any = [...(this as any)[key]];
    this.$nextTick(() => {
      callback(
        key,
        cols.find((col: any) => col.field === field),
        cols,
        this
      );
    });
  }

  created() {
    this.initData();
  }

  initData() {
    // 处理摘要
    const routeParams: any = this.$route.params;
    this.setBizSchemaCode(routeParams.bizSchemaCode);
    this.getSummary();
    this.getDataItemList();
    this.summary = Object.assign({}, formAttributeMap.summary);
  }
}
</script>

<style lang="less">
.from-attribute-options {
  min-width: 267px;
  height: 100%;
  margin-left: 8px;
  > .ant-tabs {
    > .ant-tabs-bar {
      margin-bottom: 0 !important;
    }
  }
  .ant-tabs {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    .ant-tabs-bar {
      flex: 0 0 40px;
    }
    .ant-tabs-bar,
    .ant-tabs-tabpane {
      background: #fff;
      border-radius: 4px;
    }
    .ant-tabs-nav-wrap {
      text-align: center;
    }
    .ant-tabs-content {
      flex: 1;
      height: 100%;
      .ant-tabs-tabpane {
        overflow: auto;
        max-height: 100%;
        margin-top: 8px;
      }
    }
  }
  .ant-collapse {
    border: 0;
    background-color: #ffffff;

    .ant-collapse-item {
      border-bottom: 0;

      .ant-collapse-header {
        padding-left: 29.5px;
        text-align: left;
        font-size: 14px;
        font-weight: bold;
        color: rgba(0, 0, 0, 0.85);
        .arrow {
          left: 8px;
          color: rgba(0, 0, 0, 0.65) !important;
          /*width: 10px;*/
          /*height: 8px;*/
          /*font-size: 12px;*/
          font-weight: 400 !important;
        }
      }
    }
    .ant-collapse-content {
      border-color: #e9e9e9;
      overflow: inherit;
    }
    .ant-collapse-content > .ant-collapse-content-box {
      padding: 0;
    }
  }
  .attr-row {
    display: flex;
    text-align: left;
    border-bottom: 1px solid #e9e9e9;

    .attr-lab {
      flex: 0 0 37%;
      display: inline-block;
      position: relative;
      padding: 0 8px;
      height: 31px;
      line-height: 31px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      .anticon {
        color: #000000;
        position: absolute;
        top: 9px;
        right: 6px;
      }
    }
    .ant-select {
      color: rgba(0, 0, 0, 0.85) !important;
      .ant-select-arrow {
        font-size: 14px;
      }
    }
    .attr-val {
      flex: 0 0 63%;
      max-width: 63%;
      line-height: 31px;
      border-left: 1px solid #e9e9e9;
      color: rgba(0, 0, 0, 0.85) !important;

      > *,
      .ant-calendar-picker-input,
      .ant-select-selection {
        display: block;
        width: 100%;
        border: 0;
        line-height: 31px;
        border-radius: 0;
      }
      .aufontAll {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.25);
      }
      &-disabled {
        padding: 0 8px;
        display: block;
        height: 31px;
        background-color: #f5f5f5;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .input-modal {
        display: flex;
        padding: 0 8px;
        cursor: pointer;
        .txt {
          flex: 1 1;
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .h-icon-all-ellipsis-o {
          flex: 0 0 18px;
        }
      }
      .input-box {
        display: block;
        padding: 0 8px;
        background: none;
      }
      .textarea-box {
        line-height: 22px;
        padding-top: 5px;
        box-sizing: border-box;
      }

      .ant-select-selection__rendered {
        margin-left: 8px;
        margin-right: 8px;
      }
    }
  }
}
// 表单设计页面会挡住第一行
// 如果有问题，需要覆盖改样式，请检查受是否显示选择关联表单->表单控件属性->选择业务的第一项
// .ant-select-tree-dropdown.fixed .ant-select-dropdown-search {
//   position: inherit;
// }
</style>
