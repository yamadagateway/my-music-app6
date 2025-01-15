// src/components/animations/TrackAnimationSystem.js
import Matter from "matter-js";
import { BaseParticleSystem } from "./base/BaseParticleSystem";
import { TrackAnimationFactory } from "./TrackAnimationFactory";

export class TrackAnimationSystem extends BaseParticleSystem {
  constructor(p5Instance) {
    super(p5Instance);
    console.log("Constructing TrackAnimationSystem");
    
    // 物理エンジンの初期化
    this.engine = Matter.Engine.create({
      enableSleeping: true,
    });
    this.world = this.engine.world;
    
    // 重力を調整（上向きの動きを実現するため）
    this.world.gravity.y = 0.2;
    
    this.particles = new Map();
    this.trackTypes = new Map();
    
    // デバッグモードの設定
    this.isDebugMode = true; // デバッグモードを有効化
    this.debugElements = [
      { x: 50, y: 50, size: 20, color: "red" },
      { x: 100, y: 100, size: 30, color: "blue" },
    ];
  }

  initialize(tracks) {
    console.log("Initializing animation system with tracks:", tracks.map(t => t.name));
    
    // トラックの初期化
    this.trackTypes = new Map(tracks.map(track => [track.id, track]));
    
    // アニメーションフレームの開始
    this.startAnimationLoop();
  }

  startAnimationLoop() {
    if (!this.animationFrameId) {
      const animate = () => {
        Matter.Engine.update(this.engine, 1000 / 60);
        this.animationFrameId = requestAnimationFrame(animate);
      };
      animate();
    }
  }

  triggerAnimation(trackId, x, y, note) {
    console.log("Animation trigger received:", { trackId, position: { x, y }, note });

    try {
      const trackType = this.trackTypes.get(trackId);
      if (!trackType) {
        console.warn("No track type mapping found for id:", trackId);
        return;
      }

      const config = TrackAnimationFactory.getParticleClass(trackId);
      if (!config) {
        console.warn("No animation config found for track:", trackId);
        return;
      }

      // ベロシティの正規化
      const velocityFactor = Math.min(Math.max(note.velocity || 0.7, 0), 1);
      const size = Math.max(config.minSize * (0.5 + velocityFactor * 0.5), 1);

      // スポーン設定
      const spawnConfig = config.spawn || {};
      const radius = spawnConfig.radius || 100;
      const spread = spawnConfig.spread || 1;
      
      // スポーン位置の計算
      const spawnPos = this.calculateSpawnPosition(x, y, radius, spread);
      
      // パーティクルボディの生成
      const body = this.createParticleBody(spawnPos.x, spawnPos.y, size, {
        density: config.density || 0.001,
        restitution: config.restitution || 0.6,
        friction: 0.001,
        shape: config.style || 'circle'
      });

      // パーティクルインスタンスの生成
      const particle = TrackAnimationFactory.createParticle(trackId, body, {
        ...note,
        position: spawnPos,
      });

      if (!particle) {
        console.error("Failed to create particle instance");
        return;
      }

      // 物理世界に追加
      Matter.World.add(this.world, body);
      this.particles.set(body.id, particle);

      // モーション設定の適用
      const motion = {
        force: config.motion?.force || 0.05,
        verticalBias: config.motion?.verticalBias || 0.7,
        horizontalSpread: config.motion?.horizontalSpread || 0.5,
        randomness: config.motion?.randomness || 0.3
      };

      this.applyForceToParticle(body, motion);
      
      console.log("Particle created successfully:", {
        id: body.id,
        position: spawnPos,
        size: size
      });
    } catch (error) {
      console.error("Error in triggerAnimation:", error);
    }
  }
  update() {
    try {
      const currentTime = performance.now();
      
      this.p5.push();
      
      // デバッグモードの描画
      if (this.isDebugMode) {
        this.debugElements.forEach(element => {
          this.p5.fill(element.color);
          this.p5.noStroke();
          this.p5.ellipse(element.x, element.y, element.size);
        });
        
        // パーティクル数の表示
        this.p5.fill(0);
        this.p5.textSize(14);
        this.p5.text(`Active particles: ${this.particles.size}`, 10, 20);
      }

      // パーティクルの更新と描画
      for (const [id, particle] of this.particles.entries()) {
        const updateResult = particle.update(currentTime);
        
        if (!updateResult.isAlive) {
          Matter.World.remove(this.world, particle.body);
          this.particles.delete(id);
          continue;
        }

        particle.render(this.p5, updateResult.visualState);
        
        // デバッグモードでのパーティクル情報表示
        if (this.isDebugMode) {
          this.p5.fill(0, 255, 0);
          this.p5.noStroke();
          this.p5.ellipse(particle.body.position.x, particle.body.position.y, 5);
        }
      }
      
      this.p5.pop();
    } catch (error) {
      console.error("Error in update loop:", error);
    }
  }

  cleanup() {
    // アニメーションフレームの停止
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // 物理エンジンのクリーンアップ
    Matter.World.clear(this.world);
    Matter.Engine.clear(this.engine);
  }


  updateTrackPosition(trackId, x, y) {
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

  calculateSpawnPosition(x, y, radius, spread) {
    if (radius === 0) return { x, y };

    const angle = Math.random() * Math.PI * 2;
    const distance = radius * Math.pow(Math.random(), 1 / (spread + 0.1));
    return {
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
    };
  }

  applyForceToParticle(body, motionConfig) {
    const randomFactor =
      1 + (Math.random() - 0.5) * 2 * motionConfig.randomness;
    const baseForce = motionConfig.force * randomFactor;

    const verticalForce = -baseForce * motionConfig.verticalBias;
    const horizontalForce =
      baseForce *
      (1 - motionConfig.verticalBias) *
      (Math.random() - 0.5) *
      motionConfig.horizontalSpread;

    Matter.Body.applyForce(body, body.position, {
      x: horizontalForce,
      y: verticalForce,
    });
  }
}

export const createTrackAnimationSystem = (p5Instance) => {
  console.log("Creating track animation system...");
  const system = new TrackAnimationSystem(p5Instance);
  console.log("Track animation system created");
  return system;
};
