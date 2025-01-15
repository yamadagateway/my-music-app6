// ParticleEffect.js
export class ParticleEffect {
    constructor(config) {
      this.id = config.id || Math.random().toString(36).substr(2, 9);
      this.config = config;
    }
  
    update(particle, deltaTime) {
      // サブクラスで実装
      return null;
    }
  
    render(p5, state) {
      // サブクラスで実装
    }
  }