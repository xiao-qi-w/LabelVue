// 该文件专门用于创建整个应用的路由器
import VueRouter from 'vue-router'
import Test from "@/components/Test";

// 创建路由器并暴露
const router = new VueRouter({
  mode: "history",
  routes: [
    {
      path: "/",
      component: Test,
      meta: {auth: false, title: "新功能测试"},
    },
  ]
});

// 全局后置路由守卫
router.afterEach((to) => {
  document.title = to.meta.title || '测试';
});

export default router;