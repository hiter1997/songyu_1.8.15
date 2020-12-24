export default {
  formDetail: {
    path: '/form/detail',
    name: 'form-detail',
    component: () => import('@/views/form/form-detail.vue')
    // ygc-----start-----费用报销付款申请自定义报表
  },
  application: {
    applicationExpense: {
      path: 'applicationExpense',
      name: 'applicationExpense',
      component: () => import('./songyureport/applicationExpense.vue'),
    }
    // ygc-----end-----费用报销付款申请自定义报表
  }
} as any;
