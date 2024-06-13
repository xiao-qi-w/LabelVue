<template>
  <div class="container">
    <!-- 工具栏或控制栏 -->
    <el-form class="sidebar-left">
      <el-form-item>
        <el-button type="primary" @click="prevPhoto">
          <i class="el-icon-caret-left"/>上一张
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="nextPhoto">
          <i class="el-icon-caret-right"/>下一张
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleCreateRect" :disabled="createRect">
          <i class="el-icon-collection-tag"/>创建标记
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSaveTag">
          <i class="el-icon-download"/>保存
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="zoomIn">
          <i class="el-icon-zoom-in"/>放大
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="zoomOut">
          <i class="el-icon-zoom-out"/>缩小
        </el-button>
      </el-form-item>
    </el-form>
    <!-- 展示图片的地方 -->
    <div class="main-content">
      <div class="image-display">
        <img
            v-if="imgPath.length"
            id="img-marking"
            :src="imgPath"
            :class="createRect ? 'img-edit' : 'img-normal'"
            draggable="false"
            @load="setSize"
            @mousedown="handleMouseDown"
            @mouseleave="handleMouseLeave"
            @mousemove="handleMouseMove"
            @mouseover="handleMouseOver"
            @mouseup="handleMouseUp"/>
        <!-- 垂直方向辅助线 -->
        <div
            v-show="showCross"
            class="cross cross-vertical"
            :style="{
        height: `${containerHeight}px`,
        top: `${containerTop}px`,
        left: `${mouseX}px`,
      }">
        </div>
        <!-- 水平方向辅助线 -->
        <div
            v-show="showCross"
            class="cross cross-horizontal"
            :style="{
        width: `${containerWidth}px`,
        top: `${mouseY}px`,
        left: `${containerLeft}px`,
      }">
        </div>
        <template v-if="imgLoaded">
          <!-- 绘制已生成的矩形 -->
          <div
              v-for="(tag, i) in tagList"
              :key="i"
              :class="(createRect ? 'rect-edit ' : 'rect-normal ') + (i === selectedTagIndex ? 'rect-red' : 'rect-blue')"
              :style="{
          top: `${tag.rect.top * containerHeight + containerTop}px`,
          left: `${tag.rect.left * containerWidth + containerLeft}px`,
          width: `${(tag.rect.right - tag.rect.left) * containerWidth}px`,
          height: `${(tag.rect.bottom - tag.rect.top) * containerHeight}px`,
        }"
              @click.stop="rectClick(i)">
            <div class="rect-handle top-left"></div>
            <div class="rect-handle top-right"></div>
            <div class="rect-handle bottom-left"></div>
            <div class="rect-handle bottom-right"></div>
          </div>
          <!-- 显示绘制过程 -->
          <div
              v-show="showDrawingRect"
              class="rect-edit rect-red"
              :style="{
          top: `${Math.min(drawingPosition.startY, drawingPosition.endY) + containerTop}px`,
          left: `${Math.min(drawingPosition.startX, drawingPosition.endX) + containerLeft}px`,
          width: `${Math.abs(drawingPosition.startX - drawingPosition.endX)}px`,
          height: `${Math.abs(drawingPosition.startY - drawingPosition.endY)}px`,
        }">
            <div class="rect-handle top-left"></div>
            <div class="rect-handle bottom-right"></div>
          </div>
          <el-dialog width="20vw" title="标签命名" :visible.sync="tag.visible">
            <el-form ref="tag" :model="tag">
              <el-form-item>
                <el-input v-model="tag.input" placeholder="请输入或选择已有标签名"/>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleConfirm">确认</el-button>
                <el-button @click="handleCancel">取消</el-button>
              </el-form-item>
            </el-form>
          </el-dialog>
        </template>
      </div>
    </div>
    <!-- 右侧信息展示栏 -->
    <div class="sidebar-right">
      <div class="tag-list">
        <h3>标记列表</h3>
        <p v-show="!tagList.length">暂未创建标记</p>
        <ul>
          <li v-for="(tag, i) in tagList"
              :key="i"
              :class="i === selectedTagIndex ? 'li-selected' : 'li-normal'"
              @click="rectClick(i)">
            <span>{{ tag.name }}</span>
            <el-button size="mini" type="text" icon="el-icon-edit" @click="handleEditTag(i)"/>
            <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDeleteTag(i)"/>
          </li>
        </ul>
      </div>
      <div class="path-list">
        <!--        <h3>图片路径列表</h3>-->
        <!--        <ul>-->
        <!--          <li v-for="(path, index) in paths" :key="index">{{ path }}</li>-->
        <!--        </ul>-->
        <h3>显示属性信息</h3>
        <p>showCross: {{ showCross }}</p>
        <p>containerLeft: {{ containerLeft }}</p>
        <p>containerRight: {{ containerRight }}</p>
        <p>containerTop: {{ containerTop }}</p>
        <p>containerBottom: {{ containerBottom }}</p>
        <p>containerWidth: {{ containerWidth }}</p>
        <p>containerHeight: {{ containerHeight }}</p>
        <p>mouseX: {{ mouseX }}</p>
        <p>mouseY: {{ mouseY }}</p>
        <p>mouseOffset: {{ mouseOffset }}</p>
        <p>lastMouseDown: {{ lastMouseDown }}</p>
        <p>createRect: {{ createRect }}</p>
        <p>drawingRect: {{ drawingRect }}</p>
        <p>{{ tagDict }}</p>
        <pre>{{ drawingPosition }}</pre>
      </div>
    </div>
  </div>
</template>
<script>
import axios from "axios";

export default {
  name: "ImageMarker",
  data() {
    return {
      tag: {
        input: "",
        visible: false,
      },
      minimumSize: [1, 1],
      // 单张图片所有标签数据
      tagList: [],
      tagDict: {}, // 标签种类
      content: "",
      paths: ['图片路径1', '图片路径2', '图片路径3'], // 示例图片路径数据
      count: 0,
      files: [],
      images: [
        require('E:\\郭家旗\\Pictures\\Saved Pictures\\cat.jpg'),
        require('E:\\郭家旗\\Pictures\\Saved Pictures\\bay.jpg'),
        require('E:\\郭家旗\\Pictures\\Saved Pictures\\dusk.jpg')
      ], // 替换成你自己的图片数据
      // 选中标签下标
      selectedTagIndex: -1,
      // 当前图片下标
      currentImageIndex: 0,
      scale: 1,
      zoomed: false,
      // 图片是否已加载
      imgLoaded: false,
      // 是否显示辅助线
      showCross: false,
      // 图片容器四个方位的坐标以及宽高
      containerLeft: 0,
      containerRight: 0,
      containerTop: 0,
      containerBottom: 0,
      containerWidth: 0,
      containerHeight: 0,
      // 鼠标坐标以及偏移量
      mouseX: 0,
      mouseY: 0,
      mouseOffset: 5,
      // 最近一次鼠标按下的坐标
      lastMouseDown: [0, 0],
      // 是否创建矩形
      createRect: false,
      // 是否正在绘制矩形
      drawingRect: false,
      // 绘制中矩形的位置信息
      drawingPosition: {},
    };
  },
  mounted() {
    // 添加浏览器窗口大小事件
    window.addEventListener("resize", this.setSize);
  },
  unmounted() {
    // 移除浏览器窗口大小事件
    window.removeEventListener("resize", this.setSize);
  },
  computed: {
    showDrawingRect() {
      if (!this.drawingRect) {
        return false;
      }
      return Math.abs(this.drawingPosition.startY - this.drawingPosition.endY) > 5 &&
          Math.abs(this.drawingPosition.startY - this.drawingPosition.endY) > 5
    },
    imgPath() {
      return this.images[this.currentImageIndex];
    }
  },
  methods: {
    // 加载图片路径
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
        console.log("ImageMarker.vue loadPath 异常=>" + error)
      });
    },
    // 根据图片尺寸设置准星长度+尺寸自适应
    setSize() {
      this.imgLoaded = true;
      const container = document.getElementById("img-marking");
      if (!container) return;
      const {top, bottom, left, right} = container.getBoundingClientRect();
      this.containerTop = top;
      this.containerBottom = bottom;
      this.containerLeft = left;
      this.containerRight = right;
      this.containerWidth = right - left;
      this.containerHeight = bottom - top;
    },
    // 鼠标移动
    handleMouseMove(e) {
      this.showCross = this.createRect && e.clientX < this.containerRight && e.clientY < this.containerBottom;
      if (!this.showCross) {
        return;
      }
      this.mouseX = Math.max(e.clientX - this.mouseOffset, this.containerLeft);
      this.mouseY = Math.max(e.clientY - this.mouseOffset, this.containerTop);
      if (this.drawingRect) {
        this.drawingPosition = {
          ...this.drawingPosition,
          endX: this.mouseX - this.containerLeft,
          endY: this.mouseY - this.containerTop,
        };
      }
    },
    // 鼠标移进
    handleMouseOver() {
      this.showCross = true;
      this.$emit("update:handleMouseMove", this.mouseX, this.mouseY);
    },
    // 鼠标移出
    handleMouseLeave() {
      this.showCross = false;
    },
    // 鼠标按下
    handleMouseDown(e) {
      if (!this.createRect) {
        return;
      }
      this.drawingRect = true;
      this.lastMouseDown = [e.clientX, e.clientY];
      this.drawingPosition = {
        startX: this.mouseX - this.containerLeft - this.mouseOffset,
        startY: this.mouseY - this.containerTop - this.mouseOffset,
        endX: this.mouseX - this.containerLeft - this.mouseOffset,
        endY: this.mouseY - this.containerTop - this.mouseOffset,
      };
    },
    // 鼠标按起
    handleMouseUp(e) {
      if (!this.createRect) {
        return;
      }
      this.drawingRect = false;
      this.createRect = false;
      if (
          Math.abs(e.clientX - this.lastMouseDown[0]) < this.minimumSize[0] ||
          Math.abs(e.clientY - this.lastMouseDown[1]) < this.minimumSize[1]
      ) {
        return;
      }
      this.tag.visible = true;
    },
    // 确认本次绘制
    handleConfirm() {
      let tag = {};
      // 更新标签种类
      const input = this.tag.input;
      if (this.tagDict[input] === undefined) {
        this.tagDict[input] = Object.keys(this.tagDict).length;
      }
      // 标签类别编号及名称
      const tagId = this.tagDict[input];
      const tagName = input;
      const {startX, startY, endX, endY} = this.drawingPosition;
      // 计算中心点、宽度和高度
      const centerX = (this.drawingPosition.startX + this.drawingPosition.endX) / 2;
      const centerY = (this.drawingPosition.startY + this.drawingPosition.endY) / 2;
      const width = this.drawingPosition.endX - this.drawingPosition.startX;
      const height = this.drawingPosition.endY - this.drawingPosition.startY;
      // 归一化
      const normCenterX = (centerX / this.containerWidth).toFixed(6);
      const normCenterY = (centerY / this.containerHeight).toFixed(6);
      const normWidth = (width / this.containerWidth).toFixed(6);
      const normHeight = (height / this.containerHeight).toFixed(6);
      // 赋值
      tag["name"] = tagName;
      tag["rect"] = {
        top: Math.min(startY, endY) / this.containerHeight,
        bottom: Math.max(startY, endY) / this.containerHeight,
        left: Math.min(startX, endX) / this.containerWidth,
        right: Math.max(startX, endX) / this.containerWidth,
      }
      tag["yolo"] = `${tagId} ${normCenterX} ${normCenterY} ${normWidth} ${normHeight}`
      this.tagList.push(tag);
      this.selectedTagIndex = this.tag.length - 1;
      this.tag.visible = false;
    },
    // 取消本次绘制
    handleCancel() {
      this.tag.visible = false;
    },
    // 点击方块
    rectClick(i) {
      this.selectedTagIndex = i;
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
    // 创建矩形
    handleCreateRect() {
      this.createRect = !this.createRect;
    },
    // 保存标记
    handleSaveTag() {
      axios({
        method: "POST",
        url: "http://localhost:8000/save_tags",
        data: {
          "imgPath": this.imgPath,
          "tags": this.tagDict,
        },
      }).then(response => {
        if (response.data.code === 200) {
          this.$message({
            showClose: true,
            message: response.data.message,
            type: "success"
          });
        }
      }).catch(error => {
        console.log("ImageMarker.vue handleSaveTag 异常=>" + error)
      });
    },
    // 编辑单个标记
    handleEditTag(index) {
      this.$message({
        showClose: true,
        message: "删除标签" + index,
        type: "warning"
      });
    },
    // 删除单个标记
    handleDeleteTag(index) {
      this.$message({
        showClose: true,
        message: "删除标签" + index,
        type: "warning"
      });
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
    },
  },
};
</script>
<style scoped>
/* 布局相关 */
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
  display: flex;
  flex-direction: column;
  justify-content: center;
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

.li-normal,
.li-selected {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.li-selected {
  background-color: skyblue;
}

/* 图片自适应 */
.img-normal {
  max-width: 100%;
  max-height: 100%;
}

.img-edit {
  max-width: 100%;
  max-height: 100%;
  cursor: crosshair;
}

/* 辅助线相关 */
.cross {
  position: absolute;
  background: #f85757;
  z-index: 99;
}

.cross-vertical {
  width: 2px;
}

.cross-horizontal {
  height: 2px;
}

/* 矩形标记相关 */
.rect-normal {
  position: absolute;
  z-index: 50;
  cursor: pointer;
}

.rect-edit {
  position: absolute;
  z-index: 50;
  cursor: crosshair;
}

.rect-red {
  border: 1px solid rgb(125, 5, 5);
  background: rgba(125, 5, 5, 0.3);
}

.rect-blue {
  border: 1px solid rgb(3, 38, 165);
  background: rgba(3, 38, 165, 0.3);
}

.rect-handle {
  position: absolute;
  width: 4px; /* 设置顶点宽度 */
  height: 4px; /* 设置顶点高度 */
  background: #ffffff; /* 设置顶点颜色 */
  border: 1px #000000 solid;
  cursor: nwse-resize; /* 设置光标为斜向调整大小形状 */
}

.top-left {
  top: -2px; /* 调整顶点位置 */
  left: -2px; /* 调整顶点位置 */
}

.top-right {
  top: -2px; /* 调整顶点位置 */
  right: -2px; /* 调整顶点位置 */
  cursor: nesw-resize; /* 设置光标为斜向调整大小形状 */
}

.bottom-left {
  bottom: -2px; /* 调整顶点位置 */
  left: -2px; /* 调整顶点位置 */
  cursor: nesw-resize; /* 设置光标为斜向调整大小形状 */
}

.bottom-right {
  bottom: -2px; /* 调整顶点位置 */
  right: -2px; /* 调整顶点位置 */
  cursor: nwse-resize; /* 设置光标为斜向调整大小形状 */
}
</style>