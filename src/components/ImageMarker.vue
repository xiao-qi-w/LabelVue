<template>
  <div class="container">
    <!-- 工具栏或控制栏 -->
    <el-form class="sidebar-left">
      <el-form-item>
        <el-button type="primary" @click="prevImage">
          <i class="el-icon-caret-left"/>上一张
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="nextImage">
          <i class="el-icon-caret-right"/>下一张
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="createRect = !createRect" :disabled="createRect">
          <i class="el-icon-collection-tag"/>创建标记
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="danger">
          <i class="el-icon-collection-tag"/>删除标记
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="success">
          <i class="el-icon-download"/>保存标记
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="zoomIn" :disabled="this.scale >= this.maxScale">
          <i class="el-icon-zoom-in"/>放大
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="zoomOut" :disabled="this.scale <= this.minScale">
          <i class="el-icon-zoom-out"/>缩小
        </el-button>
      </el-form-item>
      <el-form-item>
        <span>缩放比例</span>
        <el-input v-model="this.scale" disabled/>
      </el-form-item>
    </el-form>
    <!-- 展示图片的地方 -->
    <div ref="marking" class="main-content">
      <canvas ref="canvas"
              @mousedown="handleMouseDown"
              @mousemove="handleMouseMove"
              @mouseup="handleMouseUp"
              :style="`${!createRect ? '' : 'cursor: crosshair'}`"/>
      <el-dialog width="20vw" title="标签命名">
        <el-form ref="tag">
          <el-form-item>
            <el-input placeholder="请输入或选择已有标签名"/>
          </el-form-item>
          <el-form-item>
            <el-button type="primary">确认</el-button>
            <el-button>取消</el-button>
          </el-form-item>
        </el-form>
      </el-dialog>
    </div>
    <!-- 右侧信息展示栏 -->
    <div class="sidebar-right">
      <el-card class="tag-list">
        <h3>标记列表</h3>
        <p v-show="true">暂未创建标记</p>
        <ul class="tag-list">
          <!--          <li v-for="(tag, i) in tagList"
                        :key="i"
                        :class="i === selectedTagIndex ? 'li-selected' : 'li-normal'"
                        @click="rectClick(i)">
                      <span>{{ tag.name }}</span>
                      <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDeleteTag(i)"/>
                      &lt;!&ndash;            <div>&ndash;&gt;
                      &lt;!&ndash;              <el-button size="mini" type="text" icon="el-icon-edit" @click="handleEditTag(i)"/>&ndash;&gt;
                      &lt;!&ndash;              <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDeleteTag(i)"/>&ndash;&gt;
                      &lt;!&ndash;            </div>&ndash;&gt;
                    </li>-->
        </ul>
      </el-card>
      <el-card class="path-list">
        <h3>图片列表</h3>
        <!--        <ul class="tag-list">
                  <li v-for="(file, i) in files"
                      :key="i"
                      :class="i === currentImageIndex ? 'li-selected' : 'li-normal'"
                      @click="fileClick(i)">
                    {{ file }}
                  </li>
                </ul>-->
      </el-card>
    </div>
  </div>
</template>

<script>
import Rect from '@/models/Rect'; // 导入类

export default {
  name: "TestOk",
  data() {
    return {
      /* 图片相关 */
      files: [
        require('E:\\郭家旗\\Pictures\\Saved Pictures\\cat.jpg'),
        require('E:\\郭家旗\\Pictures\\Saved Pictures\\bay.jpg'),
        require('E:\\郭家旗\\Pictures\\Saved Pictures\\dusk.jpg')
      ],
      currentImageIndex: 0,
      /* 缩放相关 */
      dpr: 1,
      scale: 1,
      maxScale: 3.0,
      minScale: 0.5,
      scaleStep: 0.1,
      /* 缓存 */
      image: null,
      currentRect: null,
      bufferCanvas: null,
      bufferCtx: null,
      createRect: false,
      rects: [], // 保存所有绘制的矩形
    };
  },
  mounted() {
    this.dpr = window.devicePixelRatio || 1;
    this.loadImage();
    // 添加浏览器窗口大小事件
    window.addEventListener("resize", this.loadImage);
  },
  unmounted() {
    // 移除浏览器窗口大小事件
    window.removeEventListener("resize", this.loadImage);
  },
  computed: {
    imgPath() {
      return this.files[this.currentImageIndex];
    },
  },
  methods: {
    // 加载当前图片
    loadImage() {
      this.image = new Image();
      this.image.src = this.imgPath;
      this.image.onload = () => {
        this.image.width *= this.dpr;
        this.image.height *= this.dpr;
        this.setSize();
        this.drawCanvas();
      };
    },
    // 设置画布大小
    setSize() {
      // 获取 canvas 和其所在容器元素
      const canvas = this.$refs.canvas;
      const container = this.$refs.marking;
      const width = container.clientWidth * this.dpr;
      const height = container.clientHeight * this.dpr;
      // 设置宽高
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width / this.dpr}px`;
      canvas.style.height = `${height / this.dpr}px`;
      // 创建离屏画布
      this.bufferCanvas = document.createElement('canvas');
      this.bufferCanvas.width = canvas.width;
      this.bufferCanvas.height = canvas.height;
      this.bufferCanvas.style.width = `${width / this.dpr}px`;
      this.bufferCanvas.style.height = `${height / this.dpr}px`;
      this.bufferCtx = this.bufferCanvas.getContext('2d');
    },
    // 绘制画布
    drawCanvas() {
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext("2d");
      // 计算缩放比例
      const scaleX = canvas.width / (this.image.width / this.dpr);
      const scaleY = canvas.height / (this.image.height / this.dpr);
      this.scale = Math.min(scaleX, scaleY);
      // 计算缩放后的图片尺寸
      const scaledWidth = (this.image.width / this.dpr) * this.scale;
      const scaledHeight = (this.image.height / this.dpr) * this.scale;
      // 获取容器宽高
      const container = this.$refs.marking;
      const width = container.clientWidth * this.dpr;
      const height = container.clientHeight * this.dpr;
      // 图片相对于所在容器左上角偏移量
      const offsetX = (width - scaledWidth) / 2;
      const offsetY = (height - scaledHeight) / 2;
      // 绘制缩放后的图片到离屏画布
      this.bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
      this.bufferCtx.drawImage(this.image, offsetX, offsetY, scaledWidth, scaledHeight);
      // 绘制已创建矩形
      for (const rect of this.rects) {
        rect.draw();
      }
      // 将缩放后的图片绘制到主画布
      ctx.drawImage(this.bufferCanvas, 0, 0, canvas.width, canvas.height);
    },
    // 鼠标按下
    handleMouseDown(e) {
      if (!this.createRect) return;
      this.currentRect = new Rect(this.bufferCtx, this.dpr, 'rgba(0, 0, 255, 0.3)', e.offsetX, e.offsetY);
      this.rects.push(this.currentRect);
    },
    // 鼠标移动
    handleMouseMove(e) {
      if (!this.createRect) return;
      // 将离屏画布内容复制到主画布
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext('2d');
      this.currentRect.endX = e.offsetX;
      this.currentRect.endY = e.offsetY;
      // 清除离屏画布并重新绘制
      this.bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
      this.drawCanvas(); // 绘制背景和已有矩形
      this.currentRect.draw(); // 绘制当前矩形
      ctx.drawImage(this.bufferCanvas, 0, 0);
    },
    // 鼠标抬起
    handleMouseUp(e) {
      if (!this.createRect) return;
      // 将离屏画布内容复制到主画布
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext('2d');
      this.currentRect.endX = e.offsetX;
      this.currentRect.endY = e.offsetY;
      // 保存当前矩形
      // this.rects.push(this.currentRect);
      this.createRect = false;
      // 最后绘制
      this.bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
      this.drawCanvas(); // 绘制背景和已有矩形
      ctx.drawImage(this.bufferCanvas, 0, 0);
      // 清除 currentRect 以便重新开始绘制新的矩形
      this.currentRect = null;
    },
    // 点击放大按钮
    zoomIn() {
      if (this.scale < this.maxScale) {
        this.scale = Math.min(this.scale + this.scaleStep, this.maxScale);
        this.drawCanvas();
      }
    },
    // 点击缩小按钮
    zoomOut() {
      if (this.scale > this.minScale) {
        this.scale = Math.max(this.scale - this.scaleStep, this.minScale);
        this.drawCanvas();
      }
    },
    // 图片切换
    handleImageToggle(offset) {
      const length = this.files.length;
      this.currentImageIndex = (this.currentImageIndex + offset + length) % length;
      this.loadImage();
    },
    // 上一张
    prevImage() {
      this.handleImageToggle(-1);
    },
    // 下一张
    nextImage() {
      this.handleImageToggle(1);
      /*if (this.alterRect) {
        this.$confirm('是否保存对标记的更改?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }).then(() => {
          // 持久化对应标签
          this.handleSaveTag();
          this.handleImageToggle(1);
        }).catch(() => {
          console.log("已取消操作");
          this.handleImageToggle(1);
        });
        this.alterRect = false;
      } else {
        this.handleImageToggle(1);
      }*/
    },
  }
};
</script>

<style>
/* 布局相关 */
.container {
  display: flex;
  height: 100vh; /* 占据整个视口高度 */
}

.sidebar-left,
.sidebar-right {
  flex: 0 0 20vw; /* 固定宽度的侧边栏 */
  padding: 1vw;
  overflow-y: auto; /* 如果内容溢出，显示滚动条 */
  display: flex;
  flex-direction: column;
}

.sidebar-left {
  flex: 0 0 10vw; /* 固定宽度的侧边栏 */
}

.main-content {
  flex: 1; /* 占据剩余空间 */
  height: 94vh;
  margin-top: 3vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: auto;
  border-right: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
}

.sidebar-right > .tag-list,
.sidebar-right > .path-list {
  flex: 1; /* 平分高度 */
  overflow-y: auto; /* 内容溢出时显示滚动条 */
  margin-bottom: 10px;
  border-right: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
}
</style>
