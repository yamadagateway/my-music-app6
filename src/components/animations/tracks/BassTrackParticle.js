// src/animations/tracks/BassTrackParticle.js
import Matter from "matter-js";
import { BaseParticle } from '../base/BaseParticle';
import { PulseEffect } from '../effects/PulseEffect';

export class BassTrackParticle extends BaseParticle {
  constructor(body, config) {
    super(body, {
      ...config,
      effects: [
        new PulseEffect({
          frequency: config.note.pitch / 127 * 2,
          amplitude: config.note.velocity * 0.3
        })
      ]
    });
  }

  drawShape(p5, state) {
    const pulseState = state.effects.get('pulse');
    const size = state.size * (pulseState?.scale || 1);
    p5.circle(0, 0, size);
  }
}