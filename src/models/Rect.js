export default class Rect {
  constructor(ctx, dpr, startX, startY, scale) {
    this.ctx = ctx;
    this.dpr = dpr;
    this.color = 'rgba(0, 0, 255, 0.3)';
    this.startX = startX;
    this.startY = startY;
    this.endX = startX;
    this.endY = startY;
    this.scale = scale;
    this.dragging = false;
    this.resizing = false;
    this.vertexSize = 10;
    this.vertexIndex = -1;
  }

  get minX() {
    return Math.min(this.startX, this.endX);
  }

  get minY() {
    return Math.min(this.startY, this.endY);
  }

  get maxX() {
    return Math.max(this.startX, this.endX);
  }

  get maxY() {
    return Math.max(this.startY, this.endY);
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
    this.drawVertex(minX, minY);
    this.drawVertex(maxX, minY);
    this.drawVertex(maxX, maxY);
    this.drawVertex(minX, maxY);
  }

  /**
   * 绘制矩形顶点，坐标(x, y)
   * @param x
   * @param y
   */
  drawVertex(x, y) {
    if(this.dragging || this.resizing) {
      this.ctx.fillStyle = '#FF4500'; // 拖动或缩放状态，红色顶点
    } else {
      this.ctx.fillStyle = '#A7FC00'; // 正常状态，青色顶点
    }
    this.ctx.fillRect(x - this.vertexSize / 2, y - this.vertexSize / 2, this.vertexSize, this.vertexSize);
  }

  /**
   * 判断坐标(x, y)是否在矩形内部
   * @param x
   * @param y
   */
  isPointInside(x, y) {
    return x >= this.startX && x <= this.endX && y >= this.startY && y <= this.endY;
  }

  /**
   * 判断坐标(x, y)是否在矩形顶点内部
   * @param x
   * @param y
   */
  isPointInsideVertex(x, y) {
    const vertices = [
      {x: this.startX, y: this.startY},
      {x: this.endX, y: this.startY},
      {x: this.endX, y: this.endY},
      {x: this.startX, y: this.endY}
    ];
    for (let i = 0; i < vertices.length; i++) {
      const vx = vertices[i].x;
      const vy = vertices[i].y;
      if (x >= vx - this.vertexSize / 2 && x <= vx + this.vertexSize / 2 &&
        y >= vy - this.vertexSize / 2 && y <= vy + this.vertexSize / 2) {
        return i;
      }
    }
    return -1;
  }

  // 鼠标按下事件处理
  mouseDown(e) {
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    this.vertexIndex = this.isPointInsideVertex(mouseX, mouseY);
    if(this.vertexIndex !== -1) {
      this.resizing = true;
    } else if(this.isPointInside(mouseX, mouseY)) {
      this.dragging = true;
    }
  }

  // 鼠标移动事件处理
  mouseMove(e, that) {
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    if (this.dragging) {
      // 拖动矩形
      const disX = mouseX - that.prevX;
      const disY = mouseY - that.prevY;
      this.startX += disX;
      this.startY += disY;
      this.endX += disX;
      this.endY += disY;
      that.prevX += disX;
      that.prevY += disY;
    }
    if (this.resizing) {
      // 缩放矩形
      switch (this.vertexIndex) {
        case 0: // 左上角顶点
          this.startX = mouseX;
          this.startY = mouseY;
          break;
        case 1: // 右上角顶点
          this.endX = mouseX;
          this.startY = mouseY;
          break;
        case 2: // 右下角顶点
          this.endX = mouseX;
          this.endY = mouseY;
          break;
        case 3: // 左下角顶点
          this.startX = mouseX;
          this.endY = mouseY;
          break;
      }
    }
    this.draw();
  }

  // 鼠标松开事件处理
  mouseUp(e, that) {
    this.dragging = false;
    this.resizing = false;
  }
}
