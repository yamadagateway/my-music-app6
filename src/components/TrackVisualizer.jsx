// src/components/TrackVisualizer.jsx
import React, { useEffect, useRef } from 'react';
import { TrackAnimationFactory } from '../animations/TrackAnimationFactory';

export const TrackVisualizer = ({ trackType, notes, position }) => {
  const canvasRef = useRef(null);
  const systemRef = useRef(null);

  useEffect(() => {
    const sketch = (p5) => {
      p5.setup = () => {
        const canvas = p5.createCanvas(800, 600);
        canvas.parent(canvasRef.current);
        
        // アニメーションシステムの初期化
        systemRef.current = TrackAnimationFactory.createSystem(trackType, p5);
      };

      p5.draw = () => {
        p5.clear();
        if (systemRef.current) {
          systemRef.current.update();
        }
      };
    };

    new p5(sketch);

    return () => {
      if (systemRef.current) {
        systemRef.current.cleanup();
      }
    };
  }, [trackType]);

  // ノート入力に応じてパーティクルを生成
  useEffect(() => {
    if (systemRef.current && notes.length > 0) {
      const system = systemRef.current;
      notes.forEach(note => {
        const config = {
          ...TrackAnimationFactory.getConfig(trackType),
          note
        };

        const spawnPos = system.calculateSpawnPosition(
          position.x,
          position.y,
          config.spawnConfig.radius,
          config.spawnConfig.spread
        );

        const body = system.createParticleBody(
          spawnPos.x,
          spawnPos.y,
          config.size,
          { shape: config.shape }
        );

        const ParticleClass = TrackAnimationFactory.getParticleClass(trackType);
        const particle = new ParticleClass(body, config);
        
        system.addParticle(particle);
        system.applyForceToParticle(body, config.forceConfig);
      });
    }
  }, [notes, position, trackType]);

  return <div ref={canvasRef} />;
};