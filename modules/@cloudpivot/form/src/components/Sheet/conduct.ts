import {
  ControllerConduct,
  ControlAttributeType,
} from "@cloudpivot/form/typings";
import {
  formatterValueToSetStatus,
  formatterRequiredFormula,
} from "@cloudpivot/form/utils";
import baseAttribute from "@cloudpivot/form/src/common/component-base-attribute";
export default {
  groups: {
    base: {
      label: "基础信息",
      keys: ["name", "visible", "style", "tips", "dataItemName", "widgetType"],
    },
    controller: {
      label: "控制属性",
      keys: [
        "rows",
        "editable",
        "importable",
        "exportable",
        "importFormRelevanceForm",
        "showTotal",
        "displayFormula",
        "mobileDisplayMode",
      ],
    },
  },
  properties: {
    name: {
      ...baseAttribute.name,
      options: { //对子表的options进行重写，其名称最大长度只支持到50
        regexps: {
          required: "控件名称不能为空",
          maxLength: {
            len: 50,
            message: "长度不能超过50",
          },
          regexps: [
            {
              regexp: /^[^ ]/,
              message: "不能以空格开始",
            },
          ],
        },
      },
    },
    dataItemName: {
      ...baseAttribute.dataItemName,
    },
    style: {
      ...baseAttribute.style,
    },
    widgetType: {
      ...baseAttribute.widgetType,
      value: "子表",
    },
    width: {
      options: {
        regexps: {
          required: "列宽不能为空",
          regexps: [
            {
              regexp: /^[1-9]\d*$/,
              message: "只能输入正整数",
            },
            {
              regexp: (value: string) => parseFloat(value) <= 885,
              message: "不能超过最大宽度885",
            },
            {
              regexp: (value: string) => parseFloat(value) >= 150,
              message: `不能小于最小宽度${150}`,
            },
          ],
        },
      },
    },
    // 默认行数
    rows: {
      options: {
        regexps: {
          required: "默认行数不能为空",
          regexps: [
            {
              regexp: /^[0-9]\d*$/,
              message: "只能输入正整数",
            },
            {
              regexp: (value: string) => parseFloat(value) <= 100,
              message: "默认行数不能超过100",
            },
          ],
        },
      },
    },
    editable: {
      options: {
        // disabled: true
        hideField: (value: boolean) => {
          return !value ? ["importable"] : [];
        },
        callback: (key: boolean, attr: any, attrs: any, vm: any) => {
          let { value } = attr;
          vm.updateAttribute(key, "importable", value);
        },
      },
    },
    importFormRelevanceForm: {
      inputMethod: ControlAttributeType.Dropdown,
      options: {
        dataList: (attr: any, attrs: any) => {
          const list = [
            {
              value: "",
              label: "请选择",
            },
          ];
          if (attr.dataItem && attr.dataItem.properties) {
            attr.dataItem.properties.forEach((res: any) => {
              if (res.type === 9) {
                const listItme = {
                  value: res.code,
                  label: res.name,
                };
                list.push(listItme);
              }
            });
          }
          return new Promise((resolve, reject) => {
            resolve(list);
          });
        },
      },
    },
    displayFormula: {
      inputMethod: ControlAttributeType.Modal,
      modalType: "showRule",
      inputComponent: () =>
        import("@cloudpivot/form/src/common/components/required-condition.vue"),
      options: {
        formatter: formatterValueToSetStatus,
      },
    },
    mobileDisplayMode: {
      inputMethod: ControlAttributeType.Dropdown,
      options: {
        list: [
          {
            value: "waterfall",
            label: "瀑布样式",
          },
          {
            value: "table",
            label: "二维表",
          },
          {
            value: "page",
            label: "分页样式",
          },
        ],
      },
    },
  },
} as ControllerConduct;
