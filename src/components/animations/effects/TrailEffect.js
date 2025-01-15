// src/components/animations/effects/TrailEffect.js
import { BaseEffect } from "./BaseEffect";

export class TrailEffect extends BaseEffect {
    constructor(config) {
      super({
        id: 'trail',
        maxPoints: 10,        // 軌跡の最大ポイント数
        fadeSpeed: 0.1,       // フェードアウトの速度
        minOpacity: 0.1,      // 最小の不透明度
        ...config
      });
      this.points = [];
    }
  
    update(particle, deltaTime) {
      // 新しい位置を追加
      this.points.unshift({
        x: particle.body.position.x,
        y: particle.body.position.y,
        opacity: 1
      });
  
      // 古いポイントのフェードアウトと削除
      this.points = this.points
        .map(point => ({
          ...point,
          opacity: Math.max(point.opacity - this.config.fadeSpeed * (deltaTime / 1000), 
                           this.config.minOpacity)
        }))
        .slice(0, this.config.maxPoints);
  
      return {
        id: this.id,
        points: this.points
      };
    }
  
    render(p5, state) {
      p5.push();
      state.points.forEach((point, index) => {
        const size = particle.visualState.size * (1 - index / state.points.length);
        p5.fill(255, 255, 255, point.opacity * 255);
        p5.circle(point.x, point.y, size);
      });
      p5.pop();
    }
  }