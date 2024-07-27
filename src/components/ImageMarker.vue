<template>
  <div class="container">
    <!-- 工具栏或控制栏 -->
    <el-form class="sidebar-left">
      <el-form-item>
        <el-button type="primary" @click="handleImageSwitch(-1)">
          <i class="el-icon-caret-left"/>上一张
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleImageSwitch(1)">
          <i class="el-icon-caret-right"/>下一张
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="creating = !creating" :disabled="creating">
          <i class="el-icon-collection-tag"/>创建标记
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="danger" @click="handleDeleteLabel">
          <i class="el-icon-collection-tag"/>删除标记
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="success" @click="handleSaveLabel">
          <i class="el-icon-download"/>保存标记
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="zoom(scale + scaleStep)" :disabled="this.scale >= this.maxScale">
          <i class="el-icon-zoom-in"/>放大
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="zoom(scale - scaleStep)" :disabled="this.scale <= this.minScale">
          <i class="el-icon-zoom-out"/>缩小
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="zoom(adaptiveScale)">
          <i class="el-icon-zoom-out"/>自适应
        </el-button>
      </el-form-item>
      <el-form-item>
        <span>缩放比例</span>
        <el-input v-model="this.scale" disabled/>
      </el-form-item>
    </el-form>
    <!-- 展示图片的地方 -->
    <div ref="wrapper" class="canvas-wrapper">
      <canvas ref="canvas"
              @mousedown="handleMouseDown"
              @mousemove="handleMouseMove"
              @mouseup="handleMouseUp"/>
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
        <p>x: {{ this.currentX }}</p>
        <p>y: {{ this.currentY }}</p>
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
    <!-- 标签命名弹窗 -->
    <el-dialog ref="myDialog" width="20vw" title="标签命名" :visible.sync="showNameInput" :modal="false">
      <el-form ref="tag">
        <el-form-item>
          <el-select
              v-model="labelName"
              filterable
              allow-create
              default-first-option
              placeholder="请输入或选择已有标签名">
            <el-option
                v-for="item in labels"
                :key="item.name"
                :label="item.name"
                :value="item.name">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="showNameInput = false" type="primary">确认</el-button>
          <el-button @click="showNameInput = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
    <!-- 提示保存弹窗 -->
    <el-dialog width="20vw" title="是否保存改动？" :visible.sync="showSaveAlert" :modal="false">
      <el-form ref="tag">
        <el-form-item>
          <el-button @click="showSaveAlert = false" type="success">是</el-button>
          <el-button @click="showSaveAlert = false" type="danger">否</el-button>
          <el-button @click="showSaveAlert = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import Rect from '@/models/Rect'; // 导入类

export default {
  name: "ImageMarker",
  data() {
    return {
      /* 图片相关 */
      images: [
        require('@/assets/cat.jpg'),
        require('@/assets/bay.jpg')
      ],
      currentImageIndex: 0,
      /* 状态变量 */
      creating: false,
      canvasChanged: false,
      showNameInput: false,
      showSaveAlert: false,
      /* 缩放相关 */
      dpr: 1,
      scale: 0,
      maxScale: 3.0,
      minScale: 0.1,
      adaptiveScale: 0,
      scaleStep: 0.1,
      /* 鼠标上一刻所在位置 */
      prevX: 0,
      prevY: 0,
      /* 鼠标实时位置 */
      currentX: 0,
      currentY: 0,
      /* 缓存 */
      currentImage: null,
      wrapper: null,
      canvas: null,
      bufferCanvas: null,
      currentRect: null,
      currentRectIndex: -1,
      labelName: "", // 矩形标签
      rects: [], // 保存所有绘制的矩形
      labels: [], // 保存所有矩形标签
    };
  },
  mounted() {
    this.init();
    // 添加浏览器窗口大小事件
    window.addEventListener("resize", this.loadImage);
  },
  unmounted() {
    // 移除浏览器窗口大小事件
    window.removeEventListener("resize", this.loadImage);
  },
  computed: {
    imagePath() {
      return this.images[this.currentImageIndex];
    },
  },
  methods: {
    // 初始化
    init() {
      // 设置分辨率
      this.dpr = window.devicePixelRatio || 1;
      // 获取画布及其所在容器元素
      this.canvas = this.$refs.canvas;
      this.wrapper = this.$refs.wrapper;
      // 创建离屏画布
      this.bufferCanvas = document.createElement('canvas');
      this.loadImage();
    },
    // 加载当前图片
    loadImage() {
      this.currentImage = new Image();
      this.currentImage.src = this.imagePath;
      this.currentImage.onload = () => {
        this.currentImage.width *= this.dpr;
        this.currentImage.height *= this.dpr;
        this.setSize();
        this.drawCanvas();
      };
    },
    // 设置画布大小
    setSize() {
      // 未设置缩放倍率
      if (this.scale === 0) {
        // 获取所在容器宽高
        const width = this.wrapper.clientWidth * this.dpr;
        const height = this.wrapper.clientHeight * this.dpr;
        // 计算缩放比例
        const scaleX = width / this.currentImage.width;
        const scaleY = height / this.currentImage.height;
        this.scale = Math.min(scaleX, scaleY);
        this.adaptiveScale = this.scale;
      }
      // 计算缩放后的图片尺寸
      const scaledWidth = this.currentImage.width * this.scale;
      const scaledHeight = this.currentImage.height * this.scale;
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
      // 设置布局
      if (this.wrapper.clientHeight <= scaledHeight) {
        // 画布高度超过父元素视窗高度时，取消居中设置
        this.wrapper.style.justifyContent = '';
        this.wrapper.style.alignItems = '';
      } else {
        // 画布高度未超过父元素视窗高度时，重新居中设置
        this.wrapper.style.justifyContent = 'center';
        this.wrapper.style.alignItems = 'center';
      }
    },
    // 绘制画布
    drawCanvas() {
      const ctx = this.canvas.getContext('2d');
      const bufferCtx = this.bufferCanvas.getContext('2d');
      const width = this.canvas.width;
      const height = this.canvas.height;
      // 绘制缩放后的图片到离屏画布
      bufferCtx.clearRect(0, 0, width, height);
      bufferCtx.drawImage(this.currentImage, 0, 0, width, height);
      // 绘制已创建矩形
      if(this.currentRect) {
        this.currentRect.draw(this.scale);
      }
      for (const rect of this.rects) {
        rect.draw(this.scale);
      }
      // 将缩放后的图片绘制到主画布
      ctx.drawImage(this.bufferCanvas, 0, 0, width, height);
    },
    /**
     * 鼠标按下
     * @param e 鼠标事件
     */
    handleMouseDown(e) {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      this.prevX = mouseX;
      this.prevY = mouseY;
      // 找出被选中的矩形
      this.currentRect = null;
      if(this.currentRectIndex !== -1) {
        this.rects[this.currentRectIndex].color = 'rgba(0, 0, 255, 0.3)';
      }
      for (let i = this.rects.length - 1; i > -1; i--) {
        const rect = this.rects[i];
        if (rect.isSelected(mouseX, mouseY)) {
          rect.color = 'rgba(255, 0, 0, 0.3)';
          this.currentRect = rect;
          this.currentRectIndex = i;
          break;
        }
      }
      if (this.creating) {
        // 新建
        const bufferCtx = this.bufferCanvas.getContext('2d');
        this.currentRect = new Rect(bufferCtx, this.dpr, mouseX, mouseY, this.scale);
      } else if (this.currentRect) {
        // 拖动或缩放
        this.currentRect.mouseDown(mouseX, mouseY);
      }
    },
    /**
     * 鼠标移动
     * @param e 鼠标事件
     */
    handleMouseMove(e) {
      // 获取鼠标在Canvas中的坐标
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      this.currentX = mouseX;
      this.currentY = mouseY;
      const ctx = this.canvas.getContext('2d');
      const bufferCtx = this.bufferCanvas.getContext('2d');
      if (this.creating) {
        // 新建
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.drawImage(this.bufferCanvas, 0, 0);
        // 绘制交叉辅助线
        ctx.beginPath();
        ctx.moveTo(mouseX * this.dpr, 0);
        ctx.lineTo(mouseX * this.dpr, this.canvas.height);
        ctx.moveTo(0, mouseY * this.dpr);
        ctx.lineTo(this.canvas.width, mouseY * this.dpr);
        ctx.strokeStyle = 'red'; // 设置线条颜色
        ctx.stroke();
        if (!this.currentRect) return;
        this.currentRect.maxX = mouseX;
        this.currentRect.maxY = mouseY;
      } else if (this.currentRect) {
        // 拖动或缩放
        this.currentRect.mouseMove(e, this);
      }
      // 画布状态发生变化重新渲染
      if (this.creating || this.currentRect) {
        // 清除离屏画布并重新绘制
        bufferCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawCanvas(); // 绘制背景和已有矩形
        ctx.drawImage(this.bufferCanvas, 0, 0);
      }
    },
    /**
     * 鼠标抬起
     * @param e 鼠标事件
     */
    handleMouseUp(e) {
      // 将离屏画布内容复制到主画布
      const ctx = this.canvas.getContext('2d');
      const bufferCtx = this.bufferCanvas.getContext('2d');
      if (this.creating) {
        // 新建
        this.currentRect.maxX = e.offsetX;
        this.currentRect.maxY = e.offsetY;
        // 矩形形状合法，加入到矩形集合
        if (this.currentRect.minX !== this.currentRect.maxX
            && this.currentRect.minY !== this.currentRect.maxY) {
          this.rects.push(this.currentRect);
          this.canvasChanged = true;
        }
        this.creating = false;
        this.showNameInput = true;

        // 使用 Vue 的 $nextTick 来确保 DOM 已经更新
        // this.$nextTick(() => {
        //   // 找到对话框的 DOM 元素
        //   const dialog = this.$refs.myDialog.$el;
        //   // 设置对话框的位置，以左上角为基准调整偏移量
        //   dialog.style.position = 'absolute';
        //   dialog.style.top = e.offsetY + 'px';
        //   dialog.style.left = e.offsetX + 'px';
        //
        //   // 如果需要，你还可以添加过渡效果等
        // });
      } else if (this.currentRect) {
        // 拖动或缩放
        this.currentRect.mouseUp(this.currentImage.width, this.currentImage.height);
      }
      // 清除 currentRect 以便重新开始绘制新的矩形
      this.currentRect = null;
      // 最后绘制
      bufferCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawCanvas(); // 绘制背景和已有矩形
      ctx.drawImage(this.bufferCanvas, 0, 0);
    },
    // 保存标签
    handleSaveLabel() {
      this.rects.forEach(item => {
        if(item.changed) {
          item.changed = false;
          const {x, y, w, h} = item.normalize(this.currentImage.width, this.currentImage.height);
          console.log(x, y, w, h);
        }
      });
      this.canvasChanged = false;
    },
    // 删除选中标签
    handleDeleteLabel() {
      this.rects.splice(this.currentRectIndex, 1);
      this.labels.splice(this.currentRectIndex, 1);
      this.drawCanvas();
    },
    /**
     * 图片缩放
     * @param scale 缩放率
     */
    zoom(scale) {
      this.scale = scale;
      // 过大
      if (this.scale > this.maxScale) {
        this.scale = this.maxScale;
      }
      // 过小
      if (this.scale < this.minScale) {
        this.scale = this.minScale;
      }
      this.loadImage();
    },
    /**
     * 图片切换
     * @param offset 下标偏移量
     */
    handleImageSwitch(offset) {
      if(this.canvasChanged) {
        // 画布状态被改变，提示保存
        this.showSaveAlert = true;
        this.canvasChanged = false;
      }
      this.rects.length = 0;
      const length = this.images.length;
      this.currentImageIndex = (this.currentImageIndex + offset + length) % length;
      this.scale = 0;
      this.loadImage();
    },
    // 筛选出位置信息发生变化的矩形
    checkChanged() {
      let changedRects = [];
      this.rects.forEach(item => {
        if(item.changed) {
          changedRects.push(item);
        }
      });
      this.canvasChanged = changedRects.length !== 0;
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

.canvas-wrapper {
  flex: 65%; /* 占据剩余空间 */
  height: 94vh;
  margin-top: 3vh;
  display: flex;
  flex-direction: column;
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
