<template>
  <div class="container">
    <!-- 左侧 -->
    <div class="left">
      <!-- 图片 -->
      <div ref="wrapper" class="left-top">
        <canvas ref="canvas"
                @mousedown="handleMouseDown"
                @mousemove="handleMouseMove"
                @mouseup="handleMouseUp"/>
      </div>
      <!-- 工具栏 -->
      <div class="left-bottom">
        <el-tooltip effect="light" content="上一张" placement="top">
          <el-button circle type="warning" @click="handleImageSwitch(currentImageIndex - 1)">
            <i class="el-icon-caret-left"/>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="light" content="新建标记" placement="top">
          <el-button circle type="primary" @click="creating = !creating" :disabled="creating">
            <i class="el-icon-crop"/>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="light" content="保存标记" placement="top">
          <el-button circle type="success" @click="handleSaveLabel">
            <i class="el-icon-folder"/>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="light" content="删除标记" placement="top">
          <el-button circle type="danger" @click="handleDeleteLabel" :disabled="selectedRectIndex === -1">
            <i class="el-icon-delete"/>
          </el-button>
        </el-tooltip>
        <el-tag type="plain" style="margin: 0 10px">
          缩放率: {{ (Math.round(scale * 100) / 100).toFixed(2) }}
        </el-tag>
        <el-tooltip effect="light" content="放大" placement="top">
          <el-button circle type="primary" @click="zoom(scale + scaleStep)" :disabled="this.scale >= this.maxScale">
            <i class="el-icon-zoom-in"/>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="light" content="缩小" placement="top">
          <el-button circle type="primary" @click="zoom(scale - scaleStep)" :disabled="this.scale <= this.minScale">
            <i class="el-icon-zoom-out"/>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="light" content="自适应" placement="top">
          <el-button circle type="primary" @click="zoom(adaptiveScale)">
            <i class="el-icon-full-screen"/>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="light" content="下一张" placement="top">
          <el-button circle type="warning" @click="handleImageSwitch(currentImageIndex + 1)">
            <i class="el-icon-caret-right"/>
          </el-button>
        </el-tooltip>
      </div>
    </div>
    <!-- 右侧信息展示栏 -->
    <div class="right">
      <el-card class="label-list">
        <div slot="header">
          <span style="font-size: 16px; font-weight: bold;">标签列表</span>
        </div>
        <el-table
            fit
            :show-header="false"
            :data="rects"
            :cell-class-name="rectCellClass"
            @cell-click="rectCellClick"
            style="width: 100%">
          <el-table-column
              prop="name"
              label="标签名"
              width="200">
          </el-table-column>
          <el-table-column
              label="操作"
              width="40">
            <template slot-scope="scope">
              <el-button type="text"
                         size="small"
                         class="el-icon-delete"
                         @click="handleDeleteLabel(scope.row)"/>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      <el-card class="image-list">
        <div slot="header">
          <span style="font-size: 16px; font-weight: bold;">图片列表</span>
        </div>
        <el-table
            fit
            :show-header="false"
            :data="images"
            :cell-class-name="imageCellClass"
            @cell-click="imageCellClick"
            style="width: 100%">
          <el-table-column
              show-overflow-tooltip
              prop="url"
              label="图片路径"
              width="240">
          </el-table-column>
        </el-table>
      </el-card>
      <span>位置 x: {{ currentX }}, y: {{ currentY }}</span>
    </div>
    <!-- 标签命名弹窗 -->
    <el-dialog width="17vw"
               title="标签命名"
               :modal="false"
               :before-close="handleCancelInput"
               :close-on-click-modal="false"
               :visible.sync="showNameInput">
      <el-form ref="tag">
        <el-form-item>
          <el-select
              v-model="labelName"
              filterable
              allow-create
              clearable
              default-first-option
              placeholder="请输入或选择已有标签名">
            <el-option
                v-for="(item, i) in uniqueName"
                :key="i"
                :label="item"
                :value="item">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button size="mini" @click="handleInputLabel" type="primary">确认</el-button>
          <el-button size="mini" @click="handleCancelInput">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
    <!-- 提示保存弹窗 -->
    <el-dialog width="15vw"
               title="是否保存改动？"
               :modal="false"
               :close-on-click-modal="false"
               :visible.sync="showSaveAlert">
      <el-form ref="tag">
        <el-form-item>
          <el-button size="mini" type="success" @click="handleSaveChange(true)">是</el-button>
          <el-button size="mini" type="warning" @click="handleSaveChange(false)">否</el-button>
          <el-button size="mini" type="default" @click="showSaveAlert = false">取消</el-button>
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
        {
          id: 1,
          url: require('@/assets/cat.jpg'),
        },
        {
          id: 2,
          url: require('@/assets/bay.jpg'),
        },
      ],
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
      currentImageIndex: 0,
      targetImageIndex: -1,
      wrapper: null,
      canvas: null,
      bufferCanvas: null,
      currentRect: null,
      selectedRect: null,
      selectedRectIndex: -1,
      labelName: "", // 矩形标签
      rects: [], // 保存当前图片的矩形
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
      // const path = "http://localhost:8000/static/" + this.images[this.currentImageIndex].url;
      return this.images[this.currentImageIndex].url;
    },
    uniqueName() {
      // 去重后的标签名集合
      let names = new Set();
      this.rects.forEach(item => {
        names.add(item.name);
      });
      return names;
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
      this.loadRects();
      this.loadImage();
    },
    // 加载已保存矩形标签
    loadRects() {
      // 从 session 中获取保存的信息
      const storedRects = JSON.parse(sessionStorage.getItem(this.images[this.currentImageIndex].id));
      if (storedRects !== null) {
        const bufferCtx = this.bufferCanvas.getContext('2d');
        storedRects.forEach(item => {
          let rect = new Rect(bufferCtx, item.dpr, item.minX, item.minY, item.scale);
          rect.changed = false;
          rect.name = item.name;
          rect.maxX = item.maxX;
          rect.maxY = item.maxY;
          rect.timestamp = item.timestamp;
          rect.realScale = item.realScale;
          this.rects.push(rect);
        });
      }
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
      // 设置居中
      this.$nextTick(() => {
        // 设置垂直居中
        if (this.wrapper.clientHeight <= scaledHeight / this.dpr) {
          // 画布高度超过父元素视窗高度时，取消居中设置
          this.wrapper.style.justifyContent = '';
        } else {
          // 画布高度未超过父元素视窗高度时，重新居中设置
          this.wrapper.style.justifyContent = 'center';
        }
        // 设置水平居中
        if (this.wrapper.clientWidth <= scaledWidth / this.dpr) {
          // 画布宽度超过父元素视窗宽度时，取消居中设置
          this.wrapper.style.alignItems = '';
        } else {
          // 画布宽度未超过父元素视窗宽度时，重新居中设置
          this.wrapper.style.alignItems = 'center';
        }
      });
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
      if (this.currentRect) {
        this.currentRect.draw(this.scale);
      }
      for (const rect of this.rects) {
        if (rect === this.selectedRect) {
          rect.color = 'rgba(255, 0, 0, 0.3)';
        } else {
          rect.color = 'rgba(0, 0, 255, 0.3)';
        }
        rect.draw(this.scale);
      }
      // 将缩放后的图片绘制到主画布
      ctx.drawImage(this.bufferCanvas, 0, 0, width, height);
    },
    // 鼠标按下
    handleMouseDown(e) {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      this.prevX = mouseX;
      this.prevY = mouseY;
      // 找出被选中的矩形
      this.selectedRect = null;
      this.selectedRectIndex = -1;
      for (let i = this.rects.length - 1; i > -1; i--) {
        const rect = this.rects[i];
        if (rect.isSelected(mouseX, mouseY)) {
          this.selectedRect = rect;
          this.selectedRectIndex = i;
          break;
        }
      }
      if (this.creating) {
        // 新建
        const bufferCtx = this.bufferCanvas.getContext('2d');
        this.currentRect = new Rect(bufferCtx, this.dpr, mouseX, mouseY, this.scale);
      } else if (this.selectedRect) {
        // 拖动或缩放
        this.selectedRect.mouseDown(mouseX, mouseY);
      }
    },
    // 鼠标移动
    handleMouseMove(e) {
      // 获取鼠标在Canvas中的坐标
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      this.currentX = mouseX;
      this.currentY = mouseY;
      const ctx = this.canvas.getContext('2d');
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
      } else if (this.selectedRect) {
        // 拖动或缩放
        this.selectedRect.mouseMove(e, this);
      }
      // 画布状态发生变化重新渲染
      if (this.creating || this.selectedRect) {
        this.drawCanvas(); // 绘制背景和已有矩形
      }
    },
    // 鼠标抬起
    handleMouseUp(e) {
      if (this.creating) {
        // 新建
        this.currentRect.maxX = e.offsetX;
        this.currentRect.maxY = e.offsetY;
        this.creating = false;
        // 矩形形状合法，加入到矩形集合
        if (this.currentRect.minX !== this.currentRect.maxX
            && this.currentRect.minY !== this.currentRect.maxY) {
          this.showNameInput = true;
        }
      } else if (this.selectedRect) {
        // 拖动或缩放
        this.selectedRect.mouseUp(this.currentImage.width, this.currentImage.height);
      }
      this.drawCanvas();
    },
    // 输入标签
    handleInputLabel() {
      if (this.labelName !== "") {
        this.$message({
          showClose: true,
          message: '创建成功',
          type: 'success'
        });
        this.currentRect.name = this.labelName;
        this.rects.push(this.currentRect);
        this.canvasChanged = true;
      } else {
        this.$message({
          showClose: true,
          message: '名称不能为空',
          type: 'error'
        });
      }
      this.currentRect = null;
      this.showNameInput = false;
      this.drawCanvas();
    },
    // 取消输入
    handleCancelInput() {
      this.currentRect = null;
      this.showNameInput = false;
      this.drawCanvas();
    },
    // 保存标签
    handleSaveLabel() {
      if (this.canvasChanged) {
        this.rects.forEach(item => {
          if (item.changed) {
            item.changed = false;
            const {x, y, w, h} = item.normalize(this.currentImage.width, this.currentImage.height);
            // TODO 可以发送请求对归一化后的标签进行保存
            console.log("归一化后的参数：", `x: ${x}, y: ${y}, h: ${w}, h: ${h}`);
          }
        });
        this.canvasChanged = false;
      }
      sessionStorage.setItem(this.images[this.currentImageIndex].id, JSON.stringify(this.rects));
      this.$message({
        showClose: true,
        message: '保存成功',
        type: 'success'
      });
    },
    // 删除选中标签
    handleDeleteLabel(row) {
      for (let i = 0; i < this.rects.length; i++) {
        if (row.timestamp === this.rects[i].timestamp) {
          this.selectedRectIndex = i;
          break;
        }
      }
      this.rects.splice(this.selectedRectIndex, 1);
      this.canvasChanged = true;
      this.selectedRectIndex = -1;
      this.$message({
        showClose: true,
        message: '删除成功',
        type: 'success'
      });
      this.drawCanvas();
    },
    // 标签发生变化
    handleSaveChange(flag) {
      this.showSaveAlert = false;
      if (flag) {
        // 存入session
        sessionStorage.setItem(this.images[this.currentImageIndex].id, JSON.stringify(this.rects));
        this.handleSaveLabel();
      }
      this.executeSwitch();
    },
    // 图片缩放
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
    // 图片切换
    handleImageSwitch(index) {
      const length = this.images.length;
      this.checkChanged();
      this.targetImageIndex = (index + length) % length;
      if (this.canvasChanged) {
        // 画布状态被改变，提示保存
        this.showSaveAlert = true;
      } else {
        this.executeSwitch();
      }
    },
    // 执行切换
    executeSwitch() {
      this.canvasChanged = false;
      this.currentImageIndex = this.targetImageIndex;
      this.rects = [];
      this.scale = 0;
      this.loadRects();
      this.loadImage();
    },
    // 判断画布状态是否发生变化
    checkChanged() {
      for (let i = 0; i < this.rects.length; i++) {
        if (this.rects[i].changed) {
          this.canvasChanged = true;
          break;
        }
      }
    },
    // 标签所在行单元格样式
    rectCellClass({row, column, rowIndex, columnIndex}) {
      //利用单元格的样式的回调方法，给行列索引赋值
      row.index = rowIndex;
      column.index = columnIndex;
      if (this.selectedRectIndex === rowIndex) {
        return 'cell-clicked';
      }
      return '';
    },
    // 点击标签所在行
    rectCellClick(row, column, cell, event) {
      this.selectedRectIndex = row.index;
      this.selectedRect = this.rects[row.index];
      this.drawCanvas();
    },
    // 图片路径单元格格样式
    imageCellClass({row, column, rowIndex, columnIndex}) {
      //利用单元格的样式的回调方法，给行列索引赋值
      row.index = rowIndex;
      column.index = columnIndex;
      if (this.currentImageIndex === rowIndex) {
        return 'cell-clicked';
      }
      return '';
    },
    // 点击图片路径单元格
    imageCellClick(row, column, cell, event) {
      this.handleImageSwitch(row.index);
    },
  }
};
</script>

<style scoped>
.container {
  display: flex;
  height: 95vh;
}

.left,
.right {
  height: 100%;
  flex: 20%;
  padding: 1vw;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.left {
  flex: 80%;
}

.left-top {
  flex: 90%;
  height: 94vh;
  margin-top: 3vh;
  display: flex;
  flex-direction: column;
  overflow: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
}

.left-bottom {
  margin-top: 1vh;
  padding: 1vh;
  display: flex;
  justify-content: center;
  justify-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
}

.right > .label-list,
.right > .image-list {
  flex: 50%; /* 平分高度 */
  overflow-y: auto; /* 内容溢出时显示滚动条 */
  margin-bottom: 10px;
}

/deep/ .cell-clicked {
  background: #fdf5e6 !important;
}
</style>
