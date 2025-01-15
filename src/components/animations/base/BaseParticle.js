

export class BaseParticle {
  constructor(body, config) {
    this.body = body;
    this.config = this.normalizeConfig(config);
    this.createdAt = performance.now();
    this.lastUpdateTime = this.createdAt;
    
    // 状態管理用のプロパティ
    this.age = 0;
    this.lifeProgress = 0;
    this.currentSize = this.calculateInitialSize();
    this.visualState = this.initializeVisualState();

    console.log("Particle created with config:", this.config);
  }

  normalizeConfig(config) {
    // configのディープコピーを作成
    const normalizedConfig = {
      // デフォルト値の設定
      lifespan: config.lifespan || config.duration || 2000, // duration → lifespan
      fadeOut: config.fadeOut ?? true,
      minSize: config.minSize || 20,
      maxSize: config.maxSize || 40,
      color: config.color || '#FFFFFF',
      style: config.style || 'circle',
      effects: config.effects || [],
      note: config.note || {},
      trackId: config.trackId
    };

    console.log("Normalized config:", normalizedConfig);
    return normalizedConfig;
  }

  calculateInitialSize() {
    // ノートのベロシティに基づいてサイズを計算
    const velocity = this.config.note?.velocity || 0.7;
    const range = this.config.maxSize - this.config.minSize;
    return this.config.minSize + (range * velocity);
  }

  initializeVisualState() {
    return {
      position: { ...this.body.position },
      size: this.currentSize,
      color: this.config.color,
      opacity: 1,
      rotation: this.body.angle,
      effects: new Map(),
      style: this.config.style
    };
  }

  update(currentTime) {
    try {
      const deltaTime = currentTime - this.lastUpdateTime;
      this.age = currentTime - this.createdAt;
      this.lifeProgress = Math.min(this.age / this.config.lifespan, 1);
      this.lastUpdateTime = currentTime;

      // 生存判定
      const isAlive = this.age <= this.config.lifespan;
      if (!isAlive) {
        console.log("Particle died:", { age: this.age, lifespan: this.config.lifespan });
        return { isAlive, visualState: this.visualState };
      }

      // 基本的な視覚的状態の更新
      this.updateVisualState(deltaTime);

      // エフェクトの更新
      this.updateEffects(deltaTime);

      return {
        isAlive,
        visualState: this.visualState
      };
    } catch (error) {
      console.error("Error in particle update:", error);
      return { isAlive: false, visualState: this.visualState };
    }
  }

  updateVisualState(deltaTime) {
    // フェードアウト
    if (this.config.fadeOut) {
      this.visualState.opacity = Math.max(0, 1 - this.lifeProgress);
    }

    // 物理的な状態を視覚的な状態に反映
    this.visualState.position = { ...this.body.position };
    this.visualState.rotation = this.body.angle;

    // サイズのアニメーション（オプション）
    const sizeProgress = Math.sin(this.lifeProgress * Math.PI);
    this.visualState.size = this.currentSize * (1 - (sizeProgress * 0.2));
  }

  updateEffects(deltaTime) {
    if (!this.config.effects) return;

    this.config.effects.forEach(effect => {
      if (effect && typeof effect.update === 'function') {
        try {
          const effectState = effect.update(this, deltaTime);
          if (effectState) {
            this.visualState.effects.set(effect.id, effectState);
          }
        } catch (error) {
          console.warn("Error updating effect:", error);
        }
      }
    });
  }

  render(p5, state) {
    if (!p5 || !state) return;

    p5.push();
    try {
      // 基本的な描画設定
      p5.translate(state.position.x, state.position.y);
      p5.rotate(state.rotation);
      
      // 色と透明度の設定
      const color = p5.color(state.color);
      color.setAlpha(state.opacity * 255);
      p5.fill(color);
      p5.noStroke();

      // スタイルに応じた形状の描画
      this.drawShape(p5, state);

      // エフェクトの描画
      this.renderEffects(p5, state);
    } catch (error) {
      console.error("Error in particle render:", error);
    }
    p5.pop();
  }

  drawShape(p5, state) {
    const size = state.size;
    switch (state.style) {
      case 'square':
        p5.rectMode(p5.CENTER);
        p5.rect(0, 0, size, size);
        break;
      case 'triangle':
        const halfSize = size / 2;
        p5.triangle(-halfSize, halfSize, halfSize, halfSize, 0, -halfSize);
        break;
      case 'circle':
      default:
        p5.ellipse(0, 0, size);
    }
  }

  renderEffects(p5, state) {
    if (!state.effects) return;

    state.effects.forEach((effectState, effectId) => {
      const effect = this.config.effects.find(e => e.id === effectId);
      if (effect && typeof effect.render === 'function') {
        try {
          effect.render(p5, effectState);
        } catch (error) {
          console.warn("Error rendering effect:", error);
        }
      }
    });
  }
}