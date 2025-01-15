// src/animations/tracks/DrumTrackParticle.js
import Matter from "matter-js";
import { BaseParticle } from '../base/BaseParticle';
import { ShockwaveEffect } from '../effects/ShockwaveEffect';

export class DrumTrackParticle extends BaseParticle {
  constructor(body, config) {
    super(body, {
      ...config,
      effects: [
        new ShockwaveEffect({
          intensity: config.note.velocity,
          duration: 300
        })
      ]
    });
  }

  drawShape(p5, state) {
    const shockwaveState = state.effects.get('shockwave');
    if (shockwaveState) {
      p5.rect(-state.size/2, -state.size/2, state.size, state.size);
      // シュウェーブエフェクトの描画
      p5.circle(0, 0, state.size * shockwaveState.scale);
    }
  }
}