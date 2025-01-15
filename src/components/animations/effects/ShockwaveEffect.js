// src/components/animations/effects/ShockwaveEffect.js
import { BaseEffect } from "./BaseEffect";


export class ShockwaveEffect extends BaseEffect {
    constructor(config) {
      super({
        id: 'shockwave',
        duration: 500,         // エフェクトの継続時間（ミリ秒）
        maxRadius: 100,        // 最大の広がり
        velocityInfluence: 1,  // ベロシティの影響度
        ...config
      });
    }
  
    update(particle, deltaTime) {
      const age = performance.now() - this.startTime;
      const progress = Math.min(age / this.config.duration, 1);
      
      // 進行度に基づいて不透明度を計算
      const opacity = 1 - progress;
      if (opacity <= 0) return null;
  
      // ベロシティに基づいて半径を調整
      const velocityFactor = 1 + (particle.note?.velocity || 0.5) * this.config.velocityInfluence;
      const radius = this.config.maxRadius * progress * velocityFactor;
  
      return {
        id: this.id,
        opacity,
        radius
      };
    }
  
    render(p5, state) {
      p5.push();
      p5.noFill();
      p5.stroke(255, 255, 255, state.opacity * 255);
      p5.circle(0, 0, state.radius * 2);
      p5.pop();
    }
  }
  