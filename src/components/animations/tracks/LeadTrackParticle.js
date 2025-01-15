// src/animations/tracks/LeadTrackParticle.js
import Matter from "matter-js";
import { BaseParticle } from '../base/BaseParticle';
import { TrailEffect } from '../effects/TrailEffect';

export class LeadTrackParticle extends BaseParticle {
  constructor(body, config) {
    super(body, {
      ...config,
      effects: [
        new TrailEffect({
          length: 10,
          fadeSpeed: config.note.velocity
        })
      ],
      shape: [
        { x: 0, y: -config.size / 2 },
        { x: config.size / 2, y: config.size / 2 },
        { x: -config.size / 2, y: config.size / 2 }
      ]  // 三角形の形状として初期化
    });
  }

  drawShape(p5, state) {
    const trailState = state.effects.get('trail');
    if (trailState?.points) {
      // 軌跡の描画
      trailState.points.forEach((point, index) => {
        const alpha = 1 - (index / trailState.points.length);
        p5.fill(state.color.levels[0], state.color.levels[1], 
                state.color.levels[2], alpha * 255);
        p5.circle(point.x, point.y, state.size * 0.5);
      });
    }

    // メインの形状描画
    const shape = state.shape; // shape を参照
    p5.beginShape();
    shape.forEach((point, index) => {
      p5.vertex(point.x, point.y);
    });
    p5.endShape(p5.CLOSE);
  }
}