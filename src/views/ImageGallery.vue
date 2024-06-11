<template>
  <div class="container">
    <div class="sidebar-left">
      <!-- 工具栏或控制栏 -->
      <el-button style="margin-left: 10px;" type="primary" @click="prevPhoto">
        <i class="el-icon-caret-left"/>上一张
      </el-button>
      <el-button type="primary" @click="nextPhoto">
        <i class="el-icon-caret-right"/>下一张
      </el-button>
      <el-button type="primary" @click="nextPhoto">
        <i class="el-icon-collection-tag"/>创建标记
      </el-button>
      <el-button type="primary" @click="nextPhoto">
        <i class="el-icon-download"/>保存
      </el-button>
      <el-button type="primary" @click="zoomIn">
        <i class="el-icon-zoom-in"/>放大
      </el-button>
      <el-button type="primary" @click="zoomOut">
        <i class="el-icon-zoom-out"/>缩小
      </el-button>
    </div>
    <div class="main-content">
      <!-- 展示图片的地方 -->
      <div class="image-display">
        <ImageMarker
            :imgPath="currentImage"
            :rectList.sync="rectList"
            :selectedRectIndex.sync="selectedRectIndex"
            :minimumSize="[50, 50]"/>
      </div>
    </div>
    <div class="sidebar-right">
      <div class="tag-list">
        <h3>已生成的标签列表</h3>
        <ul>
          <li v-for="(tag, index) in tags" :key="index">{{ tag }}</li>
        </ul>
      </div>
      <div class="path-list">
        <h3>图片路径列表</h3>
        <ul>
          <li v-for="(path, index) in paths" :key="index">{{ path }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import ImageMarker from "@/components/ImageMarker.vue";

export default {
  name: "ImageGallery",
  components: {
    ImageMarker,
  },
  data() {
    return {
      tags: ['标签1', '标签2', '标签3'], // 示例标签数据
      paths: ['图片路径1', '图片路径2', '图片路径3'], // 示例图片路径数据
      count: 0,
      files: [],
      rectList: [],
      selectedRectIndex: -1,
      images: [
        require('E:\\郭家旗\\Pictures\\Saved Pictures\\cat.jpg'),
        require('E:\\郭家旗\\Pictures\\Saved Pictures\\bay.jpg'),
        require('E:\\郭家旗\\Pictures\\Saved Pictures\\dusk.jpg')
      ], // 替换成你自己的图片数据
      currentImageIndex: 0,
      scale: 1,
      zoomed: false
    };
  },
  computed: {
    currentImage() {
      return this.images[this.currentImageIndex];
    }
  },
  methods: {
    load() {
      this.count += 2
    },
    loadPath() {
      axios({
        method: "POST",
        url: "http://localhost:8000/get_image_path",
      }).then(response => {
        if (response.data.code === 200) {
          this.$message({
            showClose: true,
            message: response.data.message,
            type: "success"
          });
          this.files = response.data.data;
        }
      }).catch(error => {
        console.log("ImageGallery.vue loadPath 异常=>" + error)
      });
    },
    // 上一张
    prevPhoto() {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
      this.scale = 1; // 重置缩放比例
      this.zoomed = false; // 重置缩放状态
    },
    // 下一张
    nextPhoto() {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
      this.scale = 1; // 重置缩放比例
      this.zoomed = false; // 重置缩放状态
    },
    toggleZoom() {
      this.zoomed = !this.zoomed;
      this.scale = this.zoomed ? 2 : 1;
    },
    // 放大
    zoomIn() {
      this.zoomed = true;
      this.scale = 2;
    },
    // 缩小
    zoomOut() {
      this.zoomed = false;
      this.scale = 1;
    }
  },
  mounted() {
    this.rectList = [
      {
        bottom: 0.81446331360189,
        left: 0.2829747427502339,
        right: 0.5028063610851263,
        top: 0.3749187064749361,
      },
      {
        bottom: 0.7,
        left: 0.55,
        right: 0.9,
        top: 0.6,
      },
    ];
    this.selectedRectIndex = 1;
    this.loadPath();
  },
};
</script>
<style scoped>
.container {
  display: flex;
  height: 100vh; /* 占据整个视口高度 */
}

.sidebar-left {
  flex: 0 0 10vw; /* 固定宽度的侧边栏 */
  padding: 1vw;
  border-right: 1px solid #ccc; /* 右边框分隔线 */
  overflow-y: auto; /* 如果内容溢出，显示滚动条 */
}

.sidebar-right {
  flex: 0 0 20vw; /* 固定宽度的侧边栏 */
  padding: 1vw;
  border-left: 1px solid #ccc; /* 右边框分隔线 */
  overflow-y: auto; /* 如果内容溢出，显示滚动条 */
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1; /* 占据剩余空间 */
}

.image-display {
  width: 63vw;
  height: 94vh;
  border: 2px solid #ccc;
  margin: 3vh auto;
}

.sidebar-right > .tag-list,
.sidebar-right > .path-list {
  flex: 1; /* 平分高度 */
  overflow-y: auto; /* 内容溢出时显示滚动条 */
  margin-bottom: 20px;
}

.sidebar-right > .tag-list {
  border-bottom: 1px solid #ccc; /* 下边框分隔线 */
}

/* 一些基本样式 */
button {
  display: block;
  margin-bottom: 10px;
}

ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

ul li {
  margin-bottom: 5px;
}
</style>