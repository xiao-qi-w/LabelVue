// 引入Vue
import Vue from "vue"
// 引入App
import App from "./App"
// 引入ElementUI组件库
import ElementUI from "element-ui"
// 引入ElementUI全部样式
import "element-ui/lib/theme-chalk/index.css"
import VueRouter from "vue-router"
import router from './router'

Vue.config.productionTip = false

Vue.use(ElementUI)
Vue.use(VueRouter)


new Vue({
  el: "#app",
  render: h => h(App),
  router: router,
})
