export default class Rect {
  constructor(ctx, dpr, startX, startY, scale) {
    this.ctx = ctx;
    this.dpr = dpr;
    this.color = 'rgba(0, 0, 255, 0.3)';
    this.minX = startX;
    this.minY = startY;
    this.maxX = startX;
    this.maxY = startY;
    this.scale = scale;
    this.dragging = false;
    this.resizing = false;
    this.vertexSize = 8;
    this.vertexIndex = -1;
  }

  /**
   * 调整起止坐标
   */
  adjustCoordinate() {
    let temp = 0;
    if (this.minX > this.maxX) {
      temp = this.minX;
      this.minX = this.maxX;
      this.maxX = temp;
    }
    if (this.minY > this.maxY) {
      temp = this.minY;
      this.minY = this.maxY;
      this.maxY = temp;
    }
  }

  /**
   * 绘制矩形
   * @param scale 缩放倍率
   */
  draw(scale) {
    if (this.minX === this.maxX || this.minY === this.maxY) {
      return;
    }
    const realScale = 1 / this.scale * scale * this.dpr;
    const minX = this.minX * realScale;
    const minY = this.minY * realScale;
    const maxX = this.maxX * realScale;
    const maxY = this.maxY * realScale;
    this.ctx.beginPath();
    this.ctx.moveTo(minX, minY);
    this.ctx.lineTo(maxX, minY);
    this.ctx.lineTo(maxX, maxY);
    this.ctx.lineTo(minX, maxY);
    this.ctx.lineTo(minX, minY);
    this.ctx.fillStyle = this.color;
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 1;
    this.ctx.lineCap = 'square';
    this.ctx.fill();
    this.ctx.stroke();
    // 绘制四个顶点
    this.drawVertex(minX, maxX, minY, maxY);
  }

  /**
   * 绘制矩形四个顶点
   * @param minX 缩放后的最小横坐标
   * @param maxX 缩放后的最大横坐标
   * @param minY 缩放后的最小纵坐标
   * @param maxY 缩放后的最大纵坐标
   */
  drawVertex(minX, maxX, minY, maxY) {
    if (this.dragging || this.resizing) {
      this.ctx.fillStyle = '#FF4500'; // 拖动或缩放状态，红色顶点
    } else {
      this.ctx.fillStyle = '#A7FC00'; // 正常状态，青色顶点
    }
    const size = this.vertexSize * this.dpr;
    this.ctx.fillRect(minX - size / 2, minY - size / 2, size, size);
    this.ctx.fillRect(maxX - size / 2, minY - size / 2, size, size);
    this.ctx.fillRect(maxX - size / 2, maxY - size / 2, size, size);
    this.ctx.fillRect(minX - size / 2, maxY - size / 2, size, size);
  }

  /**
   * 根据坐标(x, y)判断矩形是否被选中
   * @param x 横坐标
   * @param y 纵坐标
   */
  isSelected(x, y) {
    return this.isPointInside(x, y) || this.isPointInsideVertex(x, y) !== -1;
  }

  /**
   * 判断坐标(x, y)是否在矩形内部
   * @param x 横坐标
   * @param y 纵坐标
   */
  isPointInside(x, y) {
    return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY;
  }

  /**
   * 判断坐标(x, y)是否在矩形顶点内部
   * @param x
   * @param y
   */
  isPointInsideVertex(x, y) {
    const vertices = [
      {x: this.minX, y: this.minY},
      {x: this.maxX, y: this.minY},
      {x: this.maxX, y: this.maxY},
      {x: this.minX, y: this.maxY}
    ];
    const size = this.vertexSize / 2 * this.dpr;
    let index = -1;
    for (let i = 0; i < vertices.length; i++) {
      const vx = vertices[i].x;
      const vy = vertices[i].y;
      if (x >= vx - size && x <= vx + size && y >= vy - size && y <= vy + size) {
        // return i;
        index = i; break;
      }
    }
    return index;
  }

  /**
   * 鼠标按下事件，按下坐标(x, y)
   * @param x
   * @param y
   */
  mouseDown(x, y) {
    this.vertexIndex = this.isPointInsideVertex(x, y);
    if (this.vertexIndex !== -1) {
      this.resizing = true;
    } else if (this.isPointInside(x, y)) {
      this.dragging = true;
    }
  }

  /**
   * 鼠标移动事件
   * @param e 鼠标事件
   * @param that vue组件
   */
  mouseMove(e, that) {
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    if (this.dragging) {
      // 拖动矩形
      const deltaX = mouseX - that.prevX;
      const deltaY = mouseY - that.prevY;
      this.minX += deltaX;
      this.minY += deltaY;
      this.maxX += deltaX;
      this.maxY += deltaY;
      that.prevX += deltaX;
      that.prevY += deltaY;
    }
    if (this.resizing) {
      // 缩放矩形
      switch (this.vertexIndex) {
        case 0: // 左上角顶点
          this.minX = mouseX;
          this.minY = mouseY;
          break;
        case 1: // 右上角顶点
          this.maxX = mouseX;
          this.minY = mouseY;
          break;
        case 2: // 右下角顶点
          this.maxX = mouseX;
          this.maxY = mouseY;
          break;
        case 3: // 左下角顶点
          this.minX = mouseX;
          this.maxY = mouseY;
          break;
      }
    }
    this.draw();
  }

  /**
   * 鼠标抬起事件
   * @param e 鼠标事件
   * @param that vue组件
   */
  mouseUp(e, that) {
    this.dragging = false;
    this.resizing = false;
    this.adjustCoordinate();
  }
}
