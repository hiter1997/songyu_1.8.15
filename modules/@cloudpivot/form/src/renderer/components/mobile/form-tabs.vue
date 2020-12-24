
<template>
  <div>
    <div class="tab-heard">
      <div 
        class="tab-heard-wrap clearfix"
        :style="{width: `${width}px`}"
      >
        <div
          class="tab-heard-item"
          v-for="(t) in tabsTitle"
          :key="t.code"
          :ref="`heardItem${t.code}`"
          :id="`heardItem${t.code}`"
          :class="{'active': t.active}"
          @click="tabClick(t.code)"
        >
          {{ t.name }}
        </div>
      </div>
      <div class="border-bottom"></div>
    </div>
    <h3-swiper
      :showDots="false" 
      v-model="activeTab" 
      class="form-rendere-swiper"
      :style="{'height': height + 'px'}"
      :itemClass="itemClass"
      ref="h3swiper"
    >
      <slot></slot>
    </h3-swiper>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Inject } from "vue-property-decorator";

import { RendererFormControl,StyleControlOptions } from "../../typings";

import { BaseControl } from "../../controls";

import {  H3Swiper, H3SwiperItem } from "h3-mobile-vue";
// H3Swiper,

// import H3Swiper from "../layout/h3-swraper/h3-swiper.vue";

@Component({
    name : 'form-tabs',
    components: {
    H3Swiper
  }
})
export default class FormTabs extends Vue {
  @Prop() 
  itemList !: any

  @Prop({
    default : '-1'
  })
  defaultActiveKey !: string

  tabsTitle:any = [];
  width = 0;
  height = 0;
  created() {
    let source: any = this.itemList.find((i: any) => i.key === this.defaultActiveKey);
    source && (this.activeTab = source.code);
    this.tabsTitle = this.itemList.map(res => {
      let active = false;
      if (res.code === this.activeTab) {
        active = true;
      }
      return {
        active,
        ...res
      }
    });
  }

  get itemClass(){
    const length = 5;
    return `tabs-${Number(Math.random().toString().substr(3,length) + Date.now()).toString(36)}`;
  }
  mounted() {
    this.width = 0;
    this.tabsTitle.forEach( res => {
      this.width += this.$refs[`heardItem${res.code}`][0].offsetWidth as number;
      //修复过长换行问题
      this.width += 1;
    })

   setTimeout(() => {
     this.setHeight();
   },1000)
    
  }

  setHeight() {
    const h3swiper:any = this.$refs.h3swiper;
    const childrenGroup = h3swiper.$children;
    let h = 0;
    childrenGroup.forEach((res:any, index) => {
      const height = res.$el.offsetHeight;
      if (height > h) {
        h = height;
      }
       
    });
    this.height = h
    console.log(h);
  }

  tabClick(code:any) {
    // const h3swiper:any = this.$refs.h3swiper;
    // const childrenGroup = h3swiper.$children;
    // childrenGroup.forEach((res:any, index) => {

    //   res.$el.style.display = 'none';
    //   if (index+1 === code) {
    //     res.$el.style.display = 'block';
    //   }
    // })

    this.activeTab = code;
    this.tabsTitle.forEach((res) => {
      res.active = false;
      if (res.code === code) {
        res.active = true;
      }
    });

    // const ele: HTMLElement  = this.$el.querySelector('.h3-swiper') as HTMLElement;
    // ele.scrollTop = 0;
    
  }

  activeTab = 0;

  @Watch('activeTab')
  onActiveTabChange(val:number) {
    this.tabClick(val);
  }
}


</script>

<style lang="less" scoped>
@import "~@cloudpivot/common/styles/mixins.less";
.tab-heard {
   overflow-y: hidden;
   overflow-x: auto;
   margin: 0 15px;
  .tab-heard-wrap {
    // margin: 0 15px;
    // padding-right: 0;
    min-width: 100%;
   
    .tab-heard-item{
      float: left;
      padding: 0.36rem 0.4rem;
      color:rgba(102,102,102,1);
      font-size: 0.4rem;
    }
    .tab-heard-item.active{
      font-weight:500;
      color:rgba(0,0,0,0.85);
      border-bottom: 0.053rem solid @primary-color;
    }

  }
  .border-bottom{
    height: 0;
    position: relative;
    .hairline("bottom", #eee);
  }
}
.form-rendere-swiper{
  /deep/.h3-swiper{
    height: 100% !important;
    min-height: 180px;
    
    zoom:1;
    &:after {
      content: '';
      display: block;
      clear: both;
    }
    // height: calc(100vh - 2.47rem) !important;
    // overflow-x: hidden;
    overflow-y: auto;//选人控件选人之后引起页面高度变化，页面部分内容隐藏
    // overflow: hidden !important;
  }

  /deep/.h3-swiper-item{
    height: auto!important;
    min-height: 20px;
    // min-height: calc(100vh - 96px);
    // position: relative!important;
    float: left;
    overflow-x: hidden;
    overflow-y: hidden;

    & > div{
      // height: calc(100vh - 2.47rem) !important;
    }

  }
}
</style>
<style lang="less">
.reverse-relevance-tabs {
  & > .form-rendere-swiper {
    // height: auto!important;
    height: calc(100vh - 2.47rem) !important;
    & >.h3-swiper {
      overflow-x: hidden;
    overflow-y: auto!important;
    & >.h3-swiper-item {
       height: calc(100vh - 2.47rem) !important;
       overflow-y: auto!important;
    }
    } 
  }
}
</style>