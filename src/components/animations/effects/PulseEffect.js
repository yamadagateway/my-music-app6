// src/components/animations/effects/PulseEffect.js
import { BaseEffect } from "./BaseEffect";

export class PulseEffect extends BaseEffect {
    constructor(config) {
      super({
        id: 'pulse',
        frequency: 1,          // 1秒あたりの脈動回数
        amplitude: 0.2,        // サイズの変動量（割合）
        velocityInfluence: 1,  // ベロシティの影響度
        ...config
      });
      this.phase = 0;
    }
  
    update(particle, deltaTime) {
      this.phase += (deltaTime / 1000) * this.config.frequency * Math.PI * 2;
      
      // ベロシティに基づいて振幅を調整
      const adjustedAmplitude = this.config.amplitude * 
        (1 + (particle.note?.velocity || 0.5) * this.config.velocityInfluence);
  
      return {
        id: this.id,
        scale: 1 + Math.sin(this.phase) * adjustedAmplitude
      };
    }
  }
  