import Matter from "matter-js";

export class PhysicsTrackAnimationSystem {
  constructor(p5Instance) {
    this.p5 = p5Instance;
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.particles = new Map();

    // キャンバスのサイズを取得
    this.canvasWidth = this.p5.width || 800;
    this.canvasHeight = this.p5.height || 600;

    // 重力を調整（上向きの力を少し加える）
    this.world.gravity.y = 0.001;

    const wallOptions = {
      isStatic: true,
      restitution: 0.8,
      friction: 0.005,
    };

    // キャンバスサイズに基づいて境界を設定
    this.bounds = {
      ground: Matter.Bodies.rectangle(this.canvasWidth / 2, this.canvasHeight + 5, this.canvasWidth, 10, wallOptions),
      leftWall: Matter.Bodies.rectangle(-5, this.canvasHeight / 2, 10, this.canvasHeight, wallOptions),
      rightWall: Matter.Bodies.rectangle(this.canvasWidth + 5, this.canvasHeight / 2, 10, this.canvasHeight, wallOptions),
      ceiling: Matter.Bodies.rectangle(this.canvasWidth / 2, -5, this.canvasWidth, 10, wallOptions),
    };

    Matter.World.add(this.world, Object.values(this.bounds));

    // 物理演算の更新を開始
    this.runner = Matter.Runner.create();
    Matter.Runner.run(this.runner, this.engine);

    this.animationConfigs = {
      0: { // Bass
        color: "#B4FFC8",
        minSize: 120,
        maxSize: 60,
        duration: 2000,
        style: "circle",
        density: 0.001,
        restitution: 0.8,
        spawn: {
          radius: 30,     // 生成範囲の半径
          spread: 1.0,    // 範囲内での分布（0-1: 0=中心集中, 1=均一分布）
        },
        motion: {
          force: 0.2,             // 基本の力の大きさ
          verticalBias: 0.8,      // 上向きの力の割合（0-1）
          horizontalSpread: 0.3,  // 横方向のばらつき（0-1）
          randomness: 0.2,        // 力の大きさのランダム性（0-1）
        }
      },
      1: { // Drums
        color: "#B4FFC8",
        minSize: 30,
        maxSize: 60,
        duration: 1500,
        style: "square",
        density: 0.001,
        restitution: 0.9,
        spawn: {
          radius: 20,
          spread: 0.8,
        },
        motion: {
          force: 0.025,
          verticalBias: 0.6,
          horizontalSpread: 0.5,
          randomness: 0.4,
        }
      },
      2: { // Lead
        color: "#B4FFC8",
        minSize: 40,
        maxSize: 100,
        duration: 2000,
        style: "triangle",
        density: 0.008,
        restitution: 0.85,
        spawn: {
          radius: 25,
          spread: 0.9,
        },
        motion: {
          force: 0.02,
          verticalBias: 0.7,
          horizontalSpread: 0.4,
          randomness: 0.3,
        }
      }
    };
  }

  calculateRandomSpawnPosition(x, y, spawnConfig) {
    const angle = Math.random() * Math.PI * 2;
    // spreadパラメータに基づいて距離を計算
    const distance = spawnConfig.radius * Math.pow(Math.random(), 1 / (spawnConfig.spread + 0.1));
    
    return {
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance
    };
  }

  createParticle(x, y, size, config) {
    const options = {
      restitution: config.restitution,
      friction: 0.001,
      density: config.density,
      render: {
        fillStyle: config.color,
      },
    };

    let body;
    
    switch (config.style) {
      case "square":
        body = Matter.Bodies.rectangle(x, y, size, size, options);
        break;
      case "triangle": {
        const triangleVertices = [
          { x: x, y: y - size/2 },           // top
          { x: x + size/2, y: y + size/2 },  // bottom right
          { x: x - size/2, y: y + size/2 }   // bottom left
        ];
        body = Matter.Bodies.fromVertices(x, y, [triangleVertices], {
          ...options,
          isConvex: true // 三角形は常に凸形状
        });
        break;
      }
      default: // circle
        body = Matter.Bodies.circle(x, y, size/2, options);
        break;
    }

    if (!body) {
      console.error("Failed to create particle body");
      // フォールバックとして円を生成
      body = Matter.Bodies.circle(x, y, size/2, options);
    }

    return body;
  }

  triggerAnimation(trackId, x, y, note) {
    const canvasX = x;
    const canvasY = y;
    
    console.log("Triggering animation for track:", trackId, "at", canvasX, canvasY, "note:", note);

    const config = this.animationConfigs[trackId] || this.animationConfigs[0];
    
    // ノートのベロシティに基づいてサイズを調整
    const velocityFactor = note?.velocity || 0.7;
    const size = config.minSize * (0.5 + velocityFactor * 0.5);

    // ピッチ情報に基づいて生成位置の範囲を調整
    const pitchFactor = note?.pitch ? (note.pitch / 127) : 0.5;
    const adjustedSpawnConfig = {
      ...config.spawn,
      radius: config.spawn.radius * (0.5 + pitchFactor * 0.5)
    };

    // ランダムな生成位置を計算
    const spawnPos = this.calculateRandomSpawnPosition(canvasX, canvasY, adjustedSpawnConfig);

    // ノート情報に基づいて運動パラメータを調整
    const adjustedMotion = {
      ...config.motion,
      force: config.motion.force * (0.8 + velocityFactor * 0.4),
      verticalBias: config.motion.verticalBias * (1 - pitchFactor * 0.3) // 高音ほど横に広がりやすく
    };

    // パーティクルを作成
    const body = this.createParticle(spawnPos.x, spawnPos.y, size, config);

    if (!body) {
      console.error("Failed to create particle");
      return;
    }

    // 調整済みのモーション設定に基づいて力を計算
    const motion = adjustedMotion;
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * motion.randomness;
    const baseForce = motion.force * randomFactor;

    // 垂直方向の力（上向き）
    const verticalForce = -baseForce * motion.verticalBias;
    
    // 水平方向の力
    const horizontalForce = baseForce * (1 - motion.verticalBias) * 
      (Math.random() - 0.5) * motion.horizontalSpread;

    Matter.Body.applyForce(body, body.position, {
      x: horizontalForce,
      y: verticalForce,
    });

    // パーティクルを世界に追加
    Matter.World.add(this.world, body);

    // 現在の時刻を記録
    const currentTime = performance.now();

    // パーティクルを管理用マップに追加（ノート情報を含める）
    this.particles.set(body.id, {
      body,
      createdAt: currentTime,
      noteStartTime: currentTime,
      noteDuration: note?.duration || 0,
      noteVelocity: velocityFactor,
      notePitch: note?.pitch || 60,
      config,
      trackId,
      originalSize: size,
      initialSpawnPoint: { x: canvasX, y: canvasY }
    });
  }

  update() {
    const currentTime = performance.now();

    this.p5.push();
    this.particles.forEach((particle, id) => {
      const age = currentTime - particle.createdAt;

      // パーティクルの寿命が過ぎたら削除
      if (age > particle.config.duration) {
        Matter.World.remove(this.world, particle.body);
        this.particles.delete(id);
        return;
      }

      const pos = particle.body.position;
      const progress = age / particle.config.duration;
      // ノートのデュレーション中かどうかを判定
      const isWithinNoteDuration = (currentTime - particle.noteStartTime) < particle.noteDuration;
      
      this.p5.push();
      // ベロシティとピッチに基づいて色を調整
      const baseColor = this.p5.color(particle.config.color);
      if (isWithinNoteDuration) {
        // ベロシティに基づいて明るさを調整
        const brightness = 100 + (particle.noteVelocity * 155);
        // ピッチに基づいて色相を調整
        const hue = (particle.notePitch / 127) * 360;
        this.p5.colorMode(this.p5.HSB);
        this.p5.fill(hue, 80, brightness);
      } else {
        this.p5.fill(0); // 非アクティブ時は黒
      }
      this.p5.noStroke();
      
      // 物理オブジェクトの位置と回転を適用
      this.p5.translate(pos.x, pos.y);
      this.p5.rotate(particle.body.angle);

      // サイズの計算（ノートのデュレーション中は大きく）
      const sizeMultiplier = isWithinNoteDuration ? 1.2 : 1.0;
      const size = particle.originalSize * sizeMultiplier;

      // 形状に応じて描画
      switch (particle.config.style) {
        case 'square':
          this.p5.rect(-size/2, -size/2, size, size);
          break;
        case 'triangle':
          this.p5.triangle(0, -size/2, size/2, size/2, -size/2, size/2);
          break;
        default:
          this.p5.circle(0, 0, size);
      }

      this.p5.pop();
    });
    this.p5.pop();
  }

  updateTrackPosition(trackId, x, y) {
    // トラックの位置が更新されたときの処理
    this.particles.forEach((particle) => {
      if (particle.trackId === trackId) {
        const body = particle.body;
        Matter.Body.translate(body, {
          x: x - body.position.x,
          y: y - body.position.y
        });
      }
    });
  }

  cleanup() {
    // 物理演算のクリーンアップ
    Matter.Runner.stop(this.runner);
    Matter.World.clear(this.world);
    Matter.Engine.clear(this.engine);
    
    // パーティクルのクリーンアップ
    this.particles.clear();
  }
}

export const createPhysicsAnimationSystem = (p5Instance) => {
  return new PhysicsTrackAnimationSystem(p5Instance);
};