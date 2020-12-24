<template>
  <div class="form-approval__instance">
    <template
      v-if="subInstanceActivity || (node.workItemStatus !== 1 && node.workItemStatus !== 2)"
    >
        <a-avatar
          class="form-approval__avatar" 
          :size="40" 
          icon="user"
          :src="getImageUrl(node.approvaler)"
        />
      <div class="form-approval__content">
        <div class="row form-approval__info">
          <label class="form-approval__username">{{ node.trustor && node.trustor.id ? `${node.approvaler.name}${$t('cloudpivot.flow.pc.trust', {name: node.trustor.name})}`:node.approvaler.name }}</label>
          <span v-if="subInstanceActivity">{{ getSubWorkflowActionStatus(node.subInstanceStatus) }}</span>
          <template v-else>
            <label :class="`workflow-action ${getWorkflowActionStatusColorClass(node.workActionType)}`">
              <span>{{ getWorkflowActionStatus(node.workActionType) }}</span>
            </label>
            <label v-if="node.from" class="workflow-action form-approval__coming">
              <span>{{ node.from.userInfo.name + '的' + getWorkflowActionStatus(node.from.fromType) }}</span>
            </label>
          </template>
        </div>
        <div class="row">
          <div class="form-approval__org">{{ node.dept }}</div>
          <div class="form-approval__date">{{ node.approvalTime }}</div>
        </div>
        <template v-if="!subInstanceActivity">
          <div v-if="node.bizComment && node.bizComment.type !== 0 && node.bizComment.type !== 9" class="row">
            <div class="form-approval__text" v-if="node.bizComment.type === 5 || node.bizComment.type === 6 || node.bizComment.type === 7">
              <span class="form-approval__participant">
                {{ getWorkflowActionStatus(node.bizComment.type) + '给' }}
                <template v-if="node.bizComment.type === 7">{{ node.forwardReceiver }}</template>
                <template v-for="(user, userIdx) in node.bizComment.userInfos">
                  {{ user.name }}
                  <template v-if="userIdx < node.bizComment.userInfos.length- 1">、</template>
                </template>
              </span>
              {{ node.bizComment.content }}
            </div>

            <div class="form-approval__text" v-else-if="node.bizComment.content">
              <span class="form-approval__opinion">{{ node.bizComment.title }}</span>
              {{ node.bizComment.content }}
            </div>

            <div class="resources" v-if="node.bizComment.resources">
              <template v-for="resource in node.bizComment.resources">
                <div class="resources__item" :key="resource.id" v-if="resource.name !== 'signsture.png'">
                  <span @click="filePreview(resource)" class="file_hover">{{ resource.name }}</span>
                  <a-icon type="cloud-download" @click="download(resource.refId)" />
                </div>
              </template>
            </div>

            <div class="form-approval__signsture clearfix" v-if="node.resources && node.resources.length">
              <template v-for="(source,index) in node.resources">
                <div :key="index" v-if="source.img" @mouseover="mouseListener(1,source)" @mouseleave="mouseListener(0,source)">
                  <img :src="source.img" @click.stop="previewImage(source)" />
                  <!-- <span
                          v-if="source.hover"
                          @click.stop="previewImage(source)"
                          class="icon aufontAll"
                  >&#xe726;</span>-->
                </div>
              </template>
            </div>
          </div>
        </template>

        <template v-else>
          <a v-if="!mockMode" class="form-approval__link" @click="goToFrom(node.workflowInstanceId, node.workItemId)">{{ $t('cloudpivot.flow.pc.ViewDetails') }} >></a>
        </template>
      </div>
    </template>
    <template v-else>
      <div class="form-approval__progress" v-if="node.approvaler && node.approvaler.length">
        <label>{{ getWorkItemStatus(node.workItemStatus) }}</label>
        <div class="form-approval__progress-users">
          <span v-for="(user, i) in node.approvaler" :key="i">{{ user.trustor && user.trustor.id ? `${user.name}${$t('cloudpivot.flow.pc.trust', {name: user.trustor.name})}`:user.name }}</span>
        </div>
      </div>
    </template>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

import { Avatar, Icon } from "@h3/antd-vue";

import { mixins } from "vue-class-component";

import WorkflowMixin from "../mixins/workflow";
import { renderer } from '@cloudpivot/form';


@Component({
  name: "approval-item",
  components: {
    AAvatar: Avatar,
    AIcon: Icon
  }
})
export default class ApprovalItem extends mixins(WorkflowMixin) {
  @Prop() node!: any;

  @Prop() subInstanceActivity!: boolean;

  @Prop({ default: false }) mockMode?: any;

  /**
   * 跳转到表单
   */
  goToFrom(workflowInstanceId: string, workItemId: string) {
    this.$router.push({
      name: "form-detail",
      query: {
        workflowInstanceId,
        workitemId: workItemId,
        isWorkFlow: "true",
        return: `${location.pathname + location.search}`
      }
    }).catch((err: any) => {err});
  }

  get apiHost(){
    return (window as any).config.apiHost
  }

  get token(){
    return window.localStorage.getItem('token');
  }

  getDownloadUrl(refId:string){
    let url = `${this.apiHost}/api/aliyun/download?refId=${refId}`;
    if(this.token){
      url += '&access_token=' + this.token;
    }
    return url;
  }

  getImageUrl(user: any) {
    if (user.imgUrl && user.imgUrl.includes('http')) {
      return user.imgUrl;
    } else if (user.imgUrl) {
      return this.getDownloadUrl(user.imgUrl);
    }
    return '';
  }

  /**
   * 下载附件
   */
  download(refId: string) {
    this.$emit("download", refId);
  }

  /**
   * 预览附件
   */
  previewImage(file: any) {
    this.$emit("previewImage", file);
  }

  /**
   * 附件的鼠标事件
   */
  mouseListener(type: number, file: any) {
    file.hover = Boolean(type);
  }

  /**
   * 附件预览
   */
  filePreview(file: any) {
    const url = renderer.UploadControl.service.getPreviewUrl(file);
    url && window.open(url);
  }
}
</script>
<style lang="less" scoped>
.file_hover {
  cursor: pointer;
}
</style>