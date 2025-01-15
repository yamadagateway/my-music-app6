import Matter from "matter-js";

export class PhysicsTrackAnimationSystem {
  constructor(p5Instance) {
    this.p5 = p5Instance;
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.particles = new Map();

    // 重力を調整（上向きの力を少し加える）
    this.world.gravity.y = 0.001;

    // 画面の境界を作成
    // キャンバスのサイズを取得
    this.canvasWidth = this.p5.width || 800;
    this.canvasHeight = this.p5.height || 600;

    const wallOptions = {
      isStatic: true,
      restitution: 0.8,
      friction: 0.005,
    };

    // キャンバスサイズに基づいて境界を設定
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

    // 物理演算の更新を開始
    this.runner = Matter.Runner.create();
    Matter.Runner.run(this.runner, this.engine);

    this.animationConfigs = {
      0: {
        color: "#B4FFC8",
        minSize: 100,
        maxSize: 60,
        duration: 500,
        style: "kick",
        density: 0.001,
        restitution: 0.8,

        spawn: {
          radius: 30,     // 生成範囲の半径
          spread: 1.0,    // 範囲内での分布（0-1: 0=中心集中, 1=均一分布）
        },
        // 初期運動の設定
        motion: {
          force: 0.2,             // 基本の力の大きさ
          verticalBias: 0.8,      // 上向きの力の割合（0-1）
          horizontalSpread: 0.3,  // 横方向のばらつき（0-1）
          randomness: 0.2,        // 力の大きさのランダム性（0-1）
        },
        angleSpeed: 0.1,
      },
      1: {
        color: "#B4FFC8",
        minSize: 30,
        maxSize: 60,
        duration: 1500,
        style: "square",
        density: 0.001,
        restitution: 0.9,
        spawn: {
          radius: 20,     // 生成範囲の半径
          spread: 0.8,    // 範囲内での分布（0-1: 0=中心集中, 1=均一分布）
        },
        // 初期運動の設定
        motion: {
          force: 0.2,             // 基本の力の大きさ
          verticalBias: 0.8,      // 上向きの力の割合（0-1）
          horizontalSpread: 0.3,  // 横方向のばらつき（0-1）
          randomness: 0.2,        // 力の大きさのランダム性（0-1）
        },
        angleSpeed: 0.1,
      },
     
    };

    console.log("PhysicsTrackAnimationSystem initialized");
  }

  // ランダムな生成位置を計算するヘルパーメソッド
  calculateRandomSpawnPosition(x, y, radius) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    return {
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
    };
  }

  triggerAnimation(trackId, x, y, note) {
    // マウス位置をキャンバス内の実際の座標に変換
    const canvasX = x;
    const canvasY = y;

    console.log(
      "Triggering animation for track:",
      trackId,
      "at",
      canvasX,
      canvasY
    );

    const config = this.animationConfigs[trackId] || this.animationConfigs[0];

    // ノートのベロシティに基づいてサイズを調整
    const velocityFactor = note?.velocity || 0.7;
    const size = config.minSize * (0.5 + velocityFactor * 0.5);
    //const size = config.minSize;

    // ランダムな生成位置を計算（変換済みの座標を使用）
    /*
    const spawnPos = this.calculateRandomSpawnPosition(
      canvasX,
      canvasY,
      config.spawnRadius
    );
    */



    // ピッチ情報に基づいて生成位置の範囲を調整
    const pitchFactor = note?.pitch ? (note.pitch / 127) : 0.5;
    const adjustedSpawnConfig = {
      ...config.spawn,
      radius: config.spawn.radius * (0.5 + pitchFactor * 0.5)
    };

    // ランダムな生成位置を計算（ピッチ調整済みの設定を使用）
    const spawnPos = this.calculateRandomSpawnPosition(canvasX, canvasY, adjustedSpawnConfig);

     // ノート情報に基づいて運動パラメータを調整
     const adjustedMotion = {
      ...config.motion,
      force: config.motion.force * (0.8 + velocityFactor * 0.4),
      verticalBias: config.motion.verticalBias * (1 - pitchFactor * 0.3) // 高音ほど横に広がりやすく
    };

    // パーティクルを作成（ランダムな位置を使用）
    const body = this.createParticle(spawnPos.x, spawnPos.y, size, config);

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

    // パーティクルを管理用マップに追加
    this.particles.set(body.id, {
      body,
      createdAt: currentTime,
      noteStartTime: currentTime,
      noteDuration: note?.duration || 0,
      noteVelocity: velocityFactor,
      notePitch: note?.pitch || 60,
      config,
      trackId,
      originalSize: size, // オリジナルのサイズを保存
      initialSpawnPoint: { x: canvasX, y: canvasY }
    });

    console.log("Particle created:", body.id);
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
      case "kick":
        return Matter.Bodies.circle(x, y, size, size, options);

      case "square":
        return Matter.Bodies.rectangle(x, y, size, size, options);

      case "triangle":
        const vertices = [
          { x: 0, y: -size / 2 },
          { x: size / 2, y: size / 2 },
          { x: -size / 2, y: size / 2 },
        ];
        return Matter.Bodies.fromVertices(x, y, [vertices], options);

      default:
        return Matter.Bodies.circle(x, y, size / 2, options);
    }
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
      const isWithinNoteDuration =
        performance.now() - particle.noteStartTime < particle.noteDuration;

      this.p5.push();
      // デュレーション中はハイライトカラー、それ以外は黒
      const color = isWithinNoteDuration ? particle.config.color : "#000000";
      this.p5.fill(color);
      this.p5.noStroke();

      // 物理オブジェクトの位置と回転を適用
      this.p5.translate(pos.x, pos.y);
      this.p5.rotate(particle.body.angle);

      // パーティクルの描画
      const size =
        particle.body.circleRadius * 2 ||
        particle.body.bounds.max.x - particle.body.bounds.min.x;

      // 形状に応じて描画
      switch (particle.config.style) {
        case "kick":
          this.p5.ellipse(-size / 2, -size / 2, size, size);
          break;
        case "square":
          this.p5.rect(-size / 2, -size / 2, size, size);
          break;
        case "triangle":
          this.p5.triangle(
            0,
            -size / 2,
            size / 2,
            size / 2,
            -size / 2,
            size / 2
          );
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
          y: y - body.position.y,
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
    console.log("PhysicsTrackAnimationSystem cleaned up");
  }
}

export const createPhysicsAnimationSystem = (p5Instance) => {
  return new PhysicsTrackAnimationSystem(p5Instance);
};
