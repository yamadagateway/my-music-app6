// src/components/animations/effects/BaseEffect.js
export class BaseEffect {
    constructor(config) {
      this.id = config.id || Math.random().toString(36).substr(2, 9);
      this.config = config;
      this.startTime = performance.now();
    }
  
    update(particle, deltaTime) {
      // オーバーライドして実装
      return null;
    }
  
    render(p5, state) {
      // オーバーライドして実装
    }
  }