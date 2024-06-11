<template>
  <div class="image-container">
    <img
        v-if="imgPath.length"
        id="img-marking"
        :src="imgPath"
        class="auto-size"
        draggable="false"
        @load="setSize"
        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
        @mousemove="handleMouseMove"
        @mouseover="handleMouseOver"
        @mouseleave="handleMouseLeave"/>
    <!-- 垂直方向辅助线 -->
    <div
        v-show="showCross"
        class="cross cross-vertical"
        :style="{
        height: `${crossHeight}px`,
        top: `${containerTop}px`,
        left: `${mouseX}px`,
      }">
    </div>
    <!-- 水平方向辅助线 -->
    <div
        v-show="showCross"
        class="cross cross-horizontal"
        :style="{
        width: `${crossWidth}px`,
        top: `${mouseY}px`,
        left: `${containerLeft}px`,
      }">
    </div>
    <template v-if="imgLoaded">
      <div
          v-for="(item, i) in rectList"
          :key="i"
          :class="i === selectedRectIndex ? 'rect rect-red' : 'rect rect-blue'"
          :style="{
          top: `${item.top * containerHeight + containerTop}px`,
          left: `${item.left * containerWidth + containerLeft}px`,
          width: `${(item.right - item.left) * containerWidth}px`,
          height: `${(item.bottom - item.top) * containerHeight}px`,
        }"
          @click.stop="rectClick(i)">
        <div class="rect-handle top-left"></div>
        <div class="rect-handle top-right"></div>
        <div class="rect-handle bottom-left"></div>
        <div class="rect-handle bottom-right"></div>
      </div>
      <div
          v-show="showDrawingRect"
          class="rect rect-red"
          :style="{
          top: `${
            Math.min(drawingPosition.startY, drawingPosition.endY) +
            containerTop
          }px`,
          left: `${
            Math.min(drawingPosition.startX, drawingPosition.endX) +
            containerLeft
          }px`,
          width: `${Math.abs(drawingPosition.startX - drawingPosition.endX)}px`,
          height: `${Math.abs(
            drawingPosition.startY - drawingPosition.endY
          )}px`,
        }">
        <div class="rect-handle top-left"></div>
        <div class="rect-handle bottom-right"></div>
      </div>
    </template>
  </div>
</template>
<script>
export default {
  name: "ImageMarker",
  props: {
    imgPath: {
      type: String,
      required: true,
    },
    rectList: {
      type: Array,
      required: true,
    },
    selectedRectIndex: {
      type: Number,
      required: true,
    },
    minimumSize: {
      type: Array,
      default: () => [50, 50],
    },
  },
  data() {
    return {
      // 图片是否已加载
      imgLoaded: false,
      // 辅助线是否显示
      showCross: false,
      // 辅助线宽高
      crossHeight: 0,
      crossWidth: 0,
      // 图片容器四个方位的坐标以及宽高
      containerLeft: 0,
      containerRight: 0,
      containerTop: 0,
      containerBottom: 0,
      containerWidth: 0,
      containerHeight: 0,
      mouseX: 0,
      mouseY: 0,
      mouseOffset: 5,
      lastMouseDown: [0, 0],
      drawingRect: false,
      drawingPosition: {},
    };
  },
  computed: {
    showDrawingRect() {
      if (!this.drawingRect) {
        return false;
      }
      if (
          Math.abs(this.drawingPosition.startY - this.drawingPosition.endY) < 8 &&
          Math.abs(this.drawingPosition.startY - this.drawingPosition.endY) < 8
      ) {
        return false;
      }
      return true;
    },
  },
  mounted() {
    window.addEventListener("resize", this.setSize);
  },
  unmounted() {
    window.removeEventListener("resize", this.setSize);
  },
  methods: {
    // 根据图片尺寸设置准星长度+尺寸自适应
    setSize() {
      this.imgLoaded = true;
      const container = document.getElementById("img-marking");
      if (!container) return;
      const {top, bottom, left, right} = container.getBoundingClientRect();
      this.crossHeight = bottom - top;
      this.crossWidth = right - left;
      this.containerTop = top;
      this.containerBottom = bottom;
      this.containerLeft = left;
      this.containerRight = right;
      this.containerWidth = this.crossWidth;
      this.containerHeight = this.crossHeight;
    },
    // 鼠标移动
    handleMouseMove(e) {
      this.showCross = e.clientX < this.containerRight && e.clientY < this.containerBottom;
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
    },
    // 鼠标移出
    handleMouseLeave() {
      this.showCross = false;
    },
    // 鼠标按下
    handleMouseDown(e) {
      this.drawingRect = true;
      this.lastMouseDown = [e.clientX, e.clientY];
      this.drawingPosition = {
        startX: this.mouseX - this.containerLeft - this.mouseOffset,
        startY: this.mouseY - this.containerTop - this.mouseOffset,
        endX: this.mouseX - this.containerLeft - this.mouseOffset,
        endY: this.mouseY - this.containerTop - this.mouseOffset,
      };
      console.log(this.rectList);
    },
    // 鼠标按起
    handleMouseUp(e) {
      this.drawingRect = false;
      if (
          Math.abs(e.clientX - this.lastMouseDown[0]) < this.minimumSize[0] ||
          Math.abs(e.clientY - this.lastMouseDown[1]) < this.minimumSize[1]
      ) {
        return;
      }
      const {startX, startY, endX, endY} = this.drawingPosition;
      const list = this.rectList;
      list.push({
        top: Math.min(startY, endY) / this.containerHeight,
        bottom: Math.max(startY, endY) / this.containerHeight,
        left: Math.min(startX, endX) / this.containerWidth,
        right: Math.max(startX, endX) / this.containerWidth,
      });
      this.$emit("update:rectList", list);
      this.$emit("update:selectedRectIndex", list.length - 1);
    },
    // 点击方块
    rectClick(i) {
      this.$emit("update:selectedRectIndex", i);
    },
  },
};
</script>
<style scoped>
.image-container {
  width: 100%;
  height: 100%;
  user-select: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.auto-size {
  max-width: 100%;
  max-height: 100%;
}

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

.rect {
  position: absolute;
  z-index: 50;
  cursor: pointer;
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