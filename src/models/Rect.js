export default class Rect {
  constructor(ctx, dpr, color, startX, startY) {
    this.ctx = ctx;
    this.dpr = dpr;
    this.color = color;
    this.startX = startX;
    this.startY = startY;
    this.endX = startX;
    this.endY = startY;
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
  // 绘制矩形
  draw() {
    if (this.minX === this.maxX || this.minY === this.maxY) {
      return;
    }
    this.ctx.beginPath();
    this.ctx.moveTo(this.minX * this.dpr, this.minY * this.dpr);
    this.ctx.lineTo(this.maxX * this.dpr, this.minY * this.dpr);
    this.ctx.lineTo(this.maxX * this.dpr, this.maxY * this.dpr);
    this.ctx.lineTo(this.minX * this.dpr, this.maxY * this.dpr);
    this.ctx.lineTo(this.minX * this.dpr, this.minY * this.dpr);
    this.ctx.fillStyle = this.color;
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 1;
    this.ctx.lineCap = 'square';
    this.ctx.fill();
    this.ctx.stroke();
  }
  // 点击事件
  onClick(event) {
    console.log('Rectangle clicked!', event);
  }
  //
  onMouseEnter(event) {
    console.log('Mouse entered rectangle!', event);
  }

  onMouseLeave(event) {
    console.log('Mouse left rectangle!', event);
  }
}