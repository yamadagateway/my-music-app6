// EnhancedPhysicsTrackAnimationSystem.js
import Matter from "matter-js";

export class PhysicsTrackAnimationSystem {
  constructor(p5Instance) {
    this.p5 = p5Instance;
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.particles = new Map();

    // 重力を微調整（上向きの動きを実現）
    this.world.gravity.y = 0.2;

    // 境界は後で設定するためここでは初期化のみ
    this.bounds = null;
    this.canvasWidth = null;
    this.canvasHeight = null;

    // 物理演算の開始
    this.runner = Matter.Runner.create();
    Matter.Runner.run(this.runner, this.engine);

    // トラックごとの設定
    this.animationConfigs = {
      0: { // Bass
        color: "#3B82F6",  // 青
        minSize: 80,
        maxSize: 160,
        duration: 2000,
        style: "circle",
        density: 0.001,
        restitution: 0.8,
        spawn: {
          radius: 30,
          spread: 1.0
        },
        motion: {
          force: 0.15,
          verticalBias: 0.8,
          horizontalSpread: 0.3,
          randomness: 0.2
        },
        noteResponse: {
          sizeScale: 1.5,     // ベロシティによるサイズ変化が大きい
          pitchEffect: 0.6,   // ピッチは中程度の影響
          durationScale: 1.2  // ノート長による持続時間への影響は大きめ
        }
      },
      1: { // Drums
        color: "#EF4444",  // 赤
        minSize: 30,
        maxSize: 60,
        duration: 1500,
        style: "square",
        density: 0.001,
        restitution: 0.9,
        spawn: {
          radius: 20,
          spread: 0.8
        },
        motion: {
          force: 0.2,
          verticalBias: 0.6,
          horizontalSpread: 0.5,
          randomness: 0.4
        },
        noteResponse: {
          sizeScale: 2.0,     // ベロシティの影響が非常に大きい
          pitchEffect: 0.3,   // ピッチの影響は小さい
          durationScale: 0.8  // ノート長の影響は小さめ
        }
      },
      2: { // Lead
        color: "#10B981",  // 緑
        minSize: 40,
        maxSize: 100,
        duration: 2000,
        style: "triangle",
        density: 0.008,
        restitution: 0.85,
        spawn: {
          radius: 25,
          spread: 0.9
        },
        motion: {
          force: 0.1,
          verticalBias: 0.7,
          horizontalSpread: 0.4,
          randomness: 0.3
        },
        noteResponse: {
          sizeScale: 1.2,     // ベロシティの影響は中程度
          pitchEffect: 1.5,   // ピッチの影響が大きい
          durationScale: 1.0  // 標準的なノート長の影響
        }
      },
      3: { // Pad
        color: "#8B5CF6",  // 紫
        minSize: 100,
        maxSize: 200,
        duration: 3000,
        style: "circle",
        density: 0.0005,
        restitution: 0.7,
        spawn: {
          radius: 40,
          spread: 1.2
        },
        motion: {
          force: 0.05,
          verticalBias: 0.6,
          horizontalSpread: 0.6,
          randomness: 0.3
        },
        noteResponse: {
          sizeScale: 0.8,     // ベロシティの影響は小さめ
          pitchEffect: 1.0,   // 標準的なピッチの影響
          durationScale: 1.5  // ノート長の影響が大きい
        }
      },
      4: { // Arpeggios
        color: "#F59E0B",  // オレンジ
        minSize: 20,
        maxSize: 50,
        duration: 1000,
        style: "triangle",
        density: 0.002,
        restitution: 0.95,
        spawn: {
          radius: 15,
          spread: 0.7
        },
        motion: {
          force: 0.25,
          verticalBias: 0.9,
          horizontalSpread: 0.2,
          randomness: 0.4
        },
        noteResponse: {
          sizeScale: 1.0,     // 標準的なベロシティの影響
          pitchEffect: 2.0,   // ピッチの影響が非常に大きい
          durationScale: 0.7  // ノート長の影響は小さい
        }
      },
      5: { // FX
        color: "#EC4899",  // ピンク
        minSize: 30,
        maxSize: 120,
        duration: 2500,
        style: "square",
        density: 0.001,
        restitution: 0.9,
        spawn: {
          radius: 35,
          spread: 1.3
        },
        motion: {
          force: 0.15,
          verticalBias: 0.5,
          horizontalSpread: 0.8,
          randomness: 0.6
        },
        noteResponse: {
          sizeScale: 1.8,     // ベロシティの影響が大きい
          pitchEffect: 1.2,   // ピッチの影響はやや大きめ
          durationScale: 1.1  // やや長めのノート長の影響
        }
      },
      6: { // Sub Bass
        color: "#1D4ED8",  // 濃い青
        minSize: 100,
        maxSize: 200,
        duration: 2500,
        style: "circle",
        density: 0.002,
        restitution: 0.7,
        spawn: {
          radius: 20,
          spread: 0.6
        },
        motion: {
          force: 0.1,
          verticalBias: 0.7,
          horizontalSpread: 0.2,
          randomness: 0.15
        },
        noteResponse: {
          sizeScale: 1.3,     // ベロシティの影響はやや大きめ
          pitchEffect: 0.4,   // ピッチの影響は小さい
          durationScale: 1.4  // ノート長の影響は大きめ
        }
      },
      7: { // Additional Percussion
        color: "#DC2626",  // 濃い赤
        minSize: 25,
        maxSize: 45,
        duration: 1000,
        style: "square",
        density: 0.001,
        restitution: 0.95,
        spawn: {
          radius: 15,
          spread: 0.7
        },
        motion: {
          force: 0.3,
          verticalBias: 0.5,
          horizontalSpread: 0.6,
          randomness: 0.5
        },
        noteResponse: {
          sizeScale: 2.2,     // ベロシティの影響が最も大きい
          pitchEffect: 0.5,   // ピッチの影響は小さめ
          durationScale: 0.6  // ノート長の影響は小さい
        }
      }
    };
    console.log("PhysicsTrackAnimationSystem initialized");
  }

  setP5Instance(p5Instance) {
    this.p5 = p5Instance;
    this.setupBounds();
    console.log("P5 instance updated and bounds set up in animation system");
  }

  setupBounds() {
    this.canvasWidth = this.p5.width || window.innerWidth;
    this.canvasHeight = this.p5.height || window.innerHeight;

    // 既存の境界を削除
    if (this.bounds) {
      Object.values(this.bounds).forEach((bound) => {
        Matter.World.remove(this.world, bound);
      });
    }

    const wallOptions = {
      isStatic: true,
      restitution: 0.8,
      friction: 0.005,
    };

    this.bounds = {
      ground: Matter.Bodies.rectangle(
        this.canvasWidth / 2,
        this.canvasHeight + 5,
        this.canvasWidth,
        10,
        wallOptions
      ),
      leftWall: Matter.Bodies.rectangle(
        -5,
        this.canvasHeight / 2,
        10,
        this.canvasHeight,
        wallOptions
      ),
      rightWall: Matter.Bodies.rectangle(
        this.canvasWidth + 5,
        this.canvasHeight / 2,
        10,
        this.canvasHeight,
        wallOptions
      ),
      ceiling: Matter.Bodies.rectangle(
        this.canvasWidth / 2,
        -5,
        this.canvasWidth,
        10,
        wallOptions
      ),
    };

    Matter.World.add(this.world, Object.values(this.bounds));
    console.log("Bounds set up with canvas dimensions:", {
      width: this.canvasWidth,
      height: this.canvasHeight,
    });
  }

  calculateSpawnPosition(x, y, config, note) {
    const angle = Math.random() * Math.PI * 2;
    const pitchFactor = note?.pitch ? note.pitch / 127 : 0.5;
    const radius =
      config.spawn.radius *
      (0.5 + pitchFactor * config.noteResponse.pitchEffect);
    const distance =
      radius * Math.pow(Math.random(), 1 / (config.spawn.spread + 0.1));

    return {
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
    };
  }

  triggerAnimation(trackId, x, y, note) {
    const config = this.animationConfigs[trackId];
    if (!config) {
      console.warn(`No config found for trackId: ${trackId}`);
      return;
    }

    // ノートパラメータに基づく調整
    const velocityFactor = note?.velocity || 0.7;
    const pitchFactor = note?.pitch ? note.pitch / 127 : 0.5;

    // サイズの計算
    const baseSize =
      config.minSize + (config.maxSize - config.minSize) * velocityFactor;
    const size =
      baseSize * (1 + (velocityFactor - 0.5) * config.noteResponse.sizeScale);

    // スポーン位置の計算
    const spawnPos = this.calculateSpawnPosition(x, y, config, note);

    // パーティクルの生成
    const body = this.createParticle(spawnPos.x, spawnPos.y, size, config);

    // 動きの計算と適用
    const motionForce =
      config.motion.force * (1 + (velocityFactor - 0.5) * 0.5);
    const verticalBias =
      config.motion.verticalBias *
      (1 - pitchFactor * config.noteResponse.pitchEffect);

    const force = {
      x: motionForce * (Math.random() - 0.5) * config.motion.horizontalSpread,
      y: -motionForce * verticalBias,
    };

    Matter.Body.applyForce(body, body.position, force);
    Matter.World.add(this.world, body);

    // パーティクル情報の保存
    this.particles.set(body.id, {
      body,
      createdAt: performance.now(),
      noteStartTime: performance.now(),
      noteDuration: note?.duration || 0,
      noteVelocity: velocityFactor,
      notePitch: note?.pitch || 60,
      config,
      trackId,
      initialSpawnPoint: { x, y },
    });
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

    switch (config.style) {
      case "square":
        return Matter.Bodies.rectangle(x, y, size, size, options);
      case "triangle": {
        const height = (size * Math.sqrt(3)) / 2;
        const vertices = [
          { x: x, y: y - height / 2 },
          { x: x + size / 2, y: y + height / 2 },
          { x: x - size / 2, y: y + height / 2 },
        ];
        return Matter.Bodies.fromVertices(x, y, [vertices], options);
      }
      default: // circle
        return Matter.Bodies.circle(x, y, size / 2, options);
    }
  }

  update() {
    const currentTime = performance.now();

    this.p5.push();
    this.particles.forEach((particle, id) => {
      const age = currentTime - particle.createdAt;
      const duration = particle.config.duration;

      if (age > duration) {
        Matter.World.remove(this.world, particle.body);
        this.particles.delete(id);
        return;
      }

      const pos = particle.body.position;
      const isWithinNoteDuration = currentTime - particle.noteStartTime < particle.noteDuration;
      
      this.p5.push();
      // ノートの演奏中は設定色、それ以外は黒
      this.p5.fill(isWithinNoteDuration ? particle.config.color : "#000000");
      this.p5.noStroke();

      // 物理オブジェクトの位置と回転を適用
      this.p5.translate(pos.x, pos.y);
      this.p5.rotate(particle.body.angle);

      // サイズの取得
      const size = particle.body.circleRadius * 2 || 
                   Math.max(
                     particle.body.bounds.max.x - particle.body.bounds.min.x,
                     particle.body.bounds.max.y - particle.body.bounds.min.y
                   );

      // 形状に応じた描画
      switch (particle.config.style) {
        case "square":
          this.p5.rect(-size/2, -size/2, size, size);
          break;
        case "triangle":
          const height = size * Math.sqrt(3) / 2;
          this.p5.triangle(0, -height/2, size/2, height/2, -size/2, height/2);
          break;
        default: // circle
          this.p5.ellipse(0, 0, size, size);
      }
      
      this.p5.pop();
    });
    this.p5.pop();
  }

  updateTrackPosition(trackId, x, y) {
    this.particles.forEach((particle) => {
      if (particle.trackId === trackId) {
        Matter.Body.translate(particle.body, {
          x: x - particle.body.position.x,
          y: y - particle.body.position.y,
        });
      }
    });
  }

  cleanup() {
    Matter.Runner.stop(this.runner);
    Matter.World.clear(this.world);
    Matter.Engine.clear(this.engine);
    this.particles.clear();
  }
}

export const createPhysicsAnimationSystem = (p5Instance) => {
  return new PhysicsTrackAnimationSystem(p5Instance);
};
