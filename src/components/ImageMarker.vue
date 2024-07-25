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
        <el-button type="primary" @click="handleCreate" :disabled="drawing">
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
              :style="`${!drawing ? '' : 'cursor: crosshair'}`"/>
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
        <p>x: {{this.prevX}}</p>
        <p>y: {{this.prevY}}</p>
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
  name: "ImageMarker",
  data() {
    return {
      /* 图片相关 */
      files: [
        require('@/assets/cat.jpg'),
        require('@/assets/bay.jpg')
      ],
      /* 辅助变量 */
      currentImageIndex: 0,
      drawing: false,
      /* 缩放相关 */
      dpr: 1,
      scale: 0,
      maxScale: 3.0,
      minScale: 0.5,
      scaleStep: 0.1,
      // 鼠标上一刻所在位置
      prevX: 0,
      prevY: 0,
      /* 缓存 */
      image: null,
      currentRect: null,
      canvas: null,
      bufferCanvas: null,
      rects: [], // 保存所有绘制的矩形
    };
  },
  mounted() {
    this.dpr = window.devicePixelRatio || 1;
    // 获取画布
    this.canvas = this.$refs.canvas;
    // 创建离屏画布
    this.bufferCanvas = document.createElement('canvas');
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
      // 获取画布所在容器元素
      const container = this.$refs.marking;
      // 未设置缩放倍率
      if(this.scale === 0) {
        // 获取所在容器宽高
        const width = container.clientWidth * this.dpr;
        const height = container.clientHeight * this.dpr;
        // 计算缩放比例
        const scaleX = width / this.image.width;
        const scaleY = height / this.image.height;
        this.scale = Math.min(scaleX, scaleY);
        this.minScale = this.scale;
      }
      // 计算缩放后的图片尺寸
      const scaledWidth = this.image.width * this.scale;
      const scaledHeight = this.image.height * this.scale;
      // 设置画布宽高
      this.canvas.width = scaledWidth;
      this.canvas.height = scaledHeight;
      this.canvas.style.width = `${scaledWidth / this.dpr}px`;
      this.canvas.style.height = `${scaledHeight / this.dpr}px`;
      // 设置离屏画布宽高
      this.bufferCanvas.width = scaledWidth;
      this.bufferCanvas.height = scaledHeight;
      this.bufferCanvas.style.width = `${scaledWidth / this.dpr}px`;
      this.bufferCanvas.style.height = `${scaledHeight / this.dpr}px`;
    },
    // 绘制画布
    drawCanvas() {
      const ctx = this.canvas.getContext('2d');
      const bufferCtx = this.bufferCanvas.getContext('2d');
      const width = this.canvas.width;
      const height = this.canvas.height;
      // 绘制缩放后的图片到离屏画布
      bufferCtx.clearRect(0, 0, width, height);
      bufferCtx.drawImage(this.image, 0, 0, width, height);
      // 绘制已创建矩形
      for (const rect of this.rects) {
        rect.draw(this.scale);
      }
      // 将缩放后的图片绘制到主画布
      ctx.drawImage(this.bufferCanvas, 0, 0, width, height);
    },
    // 处理创建标记事件
    handleCreate() {
      this.drawing = !this.drawing;
    },
    // 鼠标按下
    handleMouseDown(e) {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      this.prevX = mouseX;
      this.prevY = mouseY;
      for(let i = this.rects.length - 1; i > -1; i--) {
        const rect = this.rects[i];
        if(rect.isPointInside(mouseX, mouseY)) {
          this.currentRect = rect;
          break;
        }
      }
      if(this.currentRect) {
        this.currentRect.mouseDown(e);
      }
      if (!this.drawing) return;
      // 将离屏画布内容复制到主画布
      const bufferCtx = this.bufferCanvas.getContext('2d');
      this.currentRect = new Rect(bufferCtx, this.dpr, e.offsetX, e.offsetY, this.scale);
      this.rects.push(this.currentRect);
    },
    // 鼠标移动
    handleMouseMove(e) {
      // 将离屏画布内容复制到主画布
      const ctx = this.canvas.getContext('2d');
      const bufferCtx = this.bufferCanvas.getContext('2d');
      if(this.currentRect) {
        this.currentRect.mouseMove(e, this);
        // 清除离屏画布并重新绘制
        bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
        this.currentRect.draw(); // 绘制当前矩形
        this.drawCanvas(); // 绘制背景和已有矩形

        ctx.drawImage(this.bufferCanvas, 0, 0);
      }
      if (!this.drawing) return;
      // 清除之前的辅助线
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.drawImage(this.bufferCanvas, 0, 0);
      // 获取鼠标在Canvas中的坐标
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      // 绘制交叉辅助线
      ctx.beginPath();
      ctx.moveTo(mouseX * this.dpr, 0);
      ctx.lineTo(mouseX * this.dpr, this.canvas.height);
      ctx.moveTo(0, mouseY * this.dpr);
      ctx.lineTo(this.canvas.width, mouseY * this.dpr);
      ctx.strokeStyle = 'red'; // 设置线条颜色
      ctx.stroke();

      if (!this.currentRect) return;
      this.currentRect.endX = mouseX;
      this.currentRect.endY = mouseY;
      // 清除离屏画布并重新绘制
      bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
      this.currentRect.draw(); // 绘制当前矩形
      this.drawCanvas(); // 绘制背景和已有矩形

      ctx.drawImage(this.bufferCanvas, 0, 0);
    },
    // 鼠标抬起
    handleMouseUp(e) {
      // 将离屏画布内容复制到主画布
      const ctx = this.canvas.getContext('2d');
      const bufferCtx = this.bufferCanvas.getContext('2d');
      if(this.currentRect) {
        this.currentRect.mouseUp(e);
        bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
        this.drawCanvas(); // 绘制背景和已有矩形
        ctx.drawImage(this.bufferCanvas, 0, 0);
      }
      if (!this.drawing) return;
      this.currentRect.endX = e.offsetX;
      this.currentRect.endY = e.offsetY;
      // 保存当前矩形
      this.drawing = false;
      // 最后绘制
      bufferCtx.clearRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
      this.drawCanvas(); // 绘制背景和已有矩形
      ctx.drawImage(this.bufferCanvas, 0, 0);
      // 清除 currentRect 以便重新开始绘制新的矩形
      this.currentRect = null;
    },
    // 点击放大按钮
    zoomIn() {
      if (this.scale < this.maxScale) {
        this.scale = Math.min(this.scale + this.scaleStep, this.maxScale);
        this.loadImage();
      }
    },
    // 点击缩小按钮
    zoomOut() {
      if (this.scale > this.minScale) {
        this.scale = Math.max(this.scale - this.scaleStep, this.minScale);
        this.loadImage();
      }
    },
    // 图片切换
    handleImageToggle(offset) {
      const length = this.files.length;
      this.currentImageIndex = (this.currentImageIndex + offset + length) % length;
      this.scale = 0;
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
  height: 95vh; /* 占据整个视口高度 */
}

.sidebar-left,
.sidebar-right {
  flex: 20%; /* 固定宽度的侧边栏 */
  padding: 1vw;
  overflow-y: auto; /* 如果内容溢出，显示滚动条 */
  display: flex;
  flex-direction: column;
}

.sidebar-left {
  flex: 15%; /* 固定宽度的侧边栏 */
}

.main-content {
  flex: 65%; /* 占据剩余空间 */
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
