/*
 * @Author: panwl
 * @Date: 2020-04-22 18:31:49
 * @LastEditTime: 2020-04-22 18:33:23
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \frontend\modules\@cloudpivot\form\src\components\Dropdown\control\dropdown-control.ts
 */
import * as typings from "@cloudpivot/form/schema";

import { SelectControl } from "@cloudpivot/form/src/common/controls/select-control";

import { Watch } from "vue-property-decorator";

export abstract class DropdownControl extends SelectControl<
  typings.DropdownOptions
> {
  disableds: boolean[] = [];

  get multiple() {
    return this.controlOpts.multi;
  }

  get hasEmpty() {
    return this.controlOpts.displayEmpty;
  }

  get emptyValue() {
    return this.controlOpts.emptyValue || "(空)";
  }

  get mode() {
    return this.multiple ? "multiple" : "";
  }

  get isLongText() {
    let dateItem;
    if ((this.control as any).parentKey) {
      dateItem = this.getDataItem(this.control.key, this.control.parentKey);
    } else {
      dateItem = this.getDataItem(this.control.key);
    }
    if (!dateItem) return false;
    return dateItem.propertyType === typings.DataItemType.LongText;
  }

  @Watch("items")
  onItemsChange() {
    this.options = this.initOptions(!this.multiple);
    this.resetDisableds();
  }

  setControl() {
    this.onItemsChange();

    this.handleValueChange(this.ctrl.value);
  }

  handleValueChange(value: any[]): void {
    this.val = super.convertValue(this.multiple, value);
  }

  resetDisableds() {
    // debugger;
    if (!this.multiple || this.isLongText) {
      return;
    }
    const values = this.ctrl.value;
    if (!Array.isArray(values)) {
      return;
    }

    const len = this.countLengthOf(values.join(";"));
    this.options.forEach((k, i) => {
      if (values.indexOf(k) > -1) {
        return;
      }
      let l = this.countLengthOf(k) + 1;
      this.disableds[i] = len + l > 200;
    });
  }
}
