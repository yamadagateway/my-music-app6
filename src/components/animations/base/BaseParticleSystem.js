// BaseParticleSystem.js
import Matter from "matter-js";

export class BaseParticleSystem {
  constructor(p5Instance) {
    this.p5 = p5Instance;
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.particles = new Map();

    // キャンバスのサイズを取得
    this.canvasWidth = this.p5.width || 800;
    this.canvasHeight = this.p5.height || 600;

    // 基本設定
    this.world.gravity.y = 0.001;
    this.setupBounds();
    this.setupPhysicsWorld();
  }

  setupBounds() {
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
  }

  setupPhysicsWorld() {
    this.runner = Matter.Runner.create();
    Matter.Runner.run(this.runner, this.engine);
  }

  createParticleBody(x, y, size, options) {
    const defaultOptions = {
      restitution: 0.7,
      friction: 0.001,
      density: 0.001,
    };

    const finalOptions = { ...defaultOptions, ...options };

    // ここでconsole.logを追加
    console.log(
      "Creating particle body with options:",
      finalOptions,
      x,
      y,
      size
    );

    let body;
    try {
      if (isNaN(size) || size <= 0) {
        console.warn("Invalid size provided, defaulting to 1");
        size = 1; // 無効なsizeは1にフォールバック
      }

      if (
        !options.shape ||
        !["rectangle", "triangle", "circle"].includes(options.shape)
      ) {
        //console.warn("Invalid shape provided, defaulting to circle");
        options.shape = "circle"; // 不正なshapeはcircleにフォールバック
      }
      switch (options.shape) {
        case "rectangle":
          body = Matter.Bodies.rectangle(x, y, size, size, finalOptions);
          break;
        case "triangle": {
          const vertices = [
            { x: x, y: y - size / 2 },
            { x: x + size / 2, y: y + size / 2 },
            { x: x - size / 2, y: y + size / 2 },
          ];
          body = Matter.Bodies.fromVertices(x, y, [vertices], {
            ...finalOptions,
            isConvex: true,
          });
          break;
        }

        default:
          body = Matter.Bodies.circle(x, y, size / 2, finalOptions);
      }

      // bodyが正常に作成されたかの確認
      if (!body) {
        console.error("Failed to create body for shape", options.shape);
      }
    } catch (error) {
      console.error("Error creating particle body:", error);
      // フォールバックとして円を生成
      body = Matter.Bodies.circle(x, y, size / 2, finalOptions);
    }

    return body;
  }

  calculateSpawnPosition(x, y, radius = 0, spread = 1) {
    if (radius === 0) return { x, y };

    const angle = Math.random() * Math.PI * 2;
    const distance = radius * Math.pow(Math.random(), 1 / (spread + 0.1));

    return {
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
    };
  }


  /*
  applyForceToParticle(body, forceConfig) {
    const {
      magnitude = 0.01,
      verticalBias = 0.7,
      horizontalSpread = 0.3,
      randomness = 0.2,
    } = forceConfig;

    const randomFactor = 1 + (Math.random() - 0.5) * 2 * randomness;
    const baseForce = magnitude * randomFactor;
    const verticalForce = -baseForce * verticalBias;
    const horizontalForce =
      baseForce * (1 - verticalBias) * (Math.random() - 0.5) * horizontalSpread;

    Matter.Body.applyForce(body, body.position, {
      x: horizontalForce,
      y: verticalForce,
    });
  }
    */

  addParticle(particle) {
    Matter.World.add(this.world, particle.body);
    this.particles.set(particle.body.id, particle);
  }

  removeParticle(particleId) {
    const particle = this.particles.get(particleId);
    if (particle) {
      Matter.World.remove(this.world, particle.body);
      this.particles.delete(particleId);
    }
  }

  update() {
    const currentTime = performance.now();
    this.particles.forEach((particle, id) => {
      const updateResult = particle.update(currentTime);

      if (!updateResult.isAlive) {
        this.removeParticle(id);
        return;
      }

      particle.render(this.p5, updateResult.visualState);
    });
  }

  cleanup() {
    Matter.Runner.stop(this.runner);
    Matter.World.clear(this.world);
    Matter.Engine.clear(this.engine);
    this.particles.clear();
  }
}
