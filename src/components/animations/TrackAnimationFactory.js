//TrackAnimationFactory.js


import {
  getTrackAnimationConfig,
} from "./config/trackAnimationConfigs";


import { BassTrackParticle } from "./tracks/BassTrackParticle";
import { DrumTrackParticle } from "./tracks/DrumTrackParticle";
import { LeadTrackParticle } from "./tracks/LeadTrackParticle";

export class TrackAnimationFactory {

  static getParticleClass(trackType) {
    const trackTypeMap = {
      0: BassTrackParticle,
      1: DrumTrackParticle,
      2: LeadTrackParticle,
    };
    return trackTypeMap[trackType] || BassTrackParticle;
  }

  static createParticle(trackId, body, noteInfo) {
    const config = getTrackAnimationConfig(trackId);
    console.log("Config received for trackId", trackId, ":", config);
    const ParticleClass = this.getParticleClass(trackId);
  
    return new ParticleClass(body, {
      ...config,
      note: noteInfo,
    });
  }

  static getEffects(trackId) {
    const config = getTrackAnimationConfig(trackId);
    return config.effects.map((effectConfig) => {
      // エフェクトのインスタンスを作成
      const EffectClass = this.getEffectClass(effectConfig.type);
      return new EffectClass(effectConfig.config);
    });
  }

  static getEffectClass(effectType) {
    const effectMap = {
      pulse: PulseEffect,
      shockwave: ShockwaveEffect,
      trail: TrailEffect,
      glow: GlowEffect,
    };
    return effectMap[effectType];
  }
}
