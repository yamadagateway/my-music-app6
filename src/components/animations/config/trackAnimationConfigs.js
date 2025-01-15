// src/components/animations/config/trackAnimationConfigs.js
export const TRACK_ANIMATION_CONFIGS = {
    bass: {
      color: "#3B82F6", // 青色
      minSize: 60,      // 最小サイズを修正
      maxSize: 120,     // 最大サイズを修正
      lifespan: 2000,   // durationをlifespanに変更
      style: "circle",
      density: 0.001,
      restitution: 0.8,
      spawn: {
        radius: 30,
        spread: 1.0
      },
      motion: {
        force: 0.2,
        verticalBias: 0.8,
        horizontalSpread: 0.3,
        randomness: 0.2
      },
      effects: [
        {
          type: 'pulse',
          config: {
            frequency: 1,
            amplitude: 0.2
          }
        },
        {
          type: 'glow',
          config: {
            intensity: 0.7,
            size: 1.8
          }
        }
      ]
    },
    drums: {
      color: "#EF4444", // 赤色
      minSize: 30,
      maxSize: 60,
      lifespan: 1500,   // durationをlifespanに変更
      style: "square",
      density: 0.001,
      restitution: 0.9,
      spawn: {
        radius: 20,
        spread: 0.8
      },
      motion: {
        force: 0.025,
        verticalBias: 0.6,
        horizontalSpread: 0.5,
        randomness: 0.4
      },
      effects: [
        {
          type: 'shockwave',
          config: {
            duration: 300,
            maxRadius: 80
          }
        }
      ]
    },
    lead: {
      color: "#10B981", // 緑色
      minSize: 40,
      maxSize: 100,
      lifespan: 2000,   // durationをlifespanに変更
      style: "triangle",
      density: 0.008,
      restitution: 0.85,
      spawn: {
        radius: 25,
        spread: 0.9
      },
      motion: {
        force: 0.02,
        verticalBias: 0.7,
        horizontalSpread: 0.4,
        randomness: 0.3
      },
      effects: [
        {
          type: 'trail',
          config: {
            maxPoints: 15,
            fadeSpeed: 0.15
          }
        }
      ]
    }
  };
  
  export const getTrackAnimationConfig = (trackId) => {
    console.log("Getting animation config for trackId:", trackId);
    
    const trackTypeMap = {
      0: 'bass',
      1: 'drums',
      2: 'lead'
    };
    
    const trackType = trackTypeMap[trackId];
    if (!trackType) {
      console.warn(`No config found for trackId ${trackId}, using bass as default`);
      return TRACK_ANIMATION_CONFIGS.bass;
    }
  
    const config = TRACK_ANIMATION_CONFIGS[trackType];
    console.log(`Retrieved config for ${trackType}:`, config);
    return config;
  };
  
  // デバッグ用のヘルパー関数
  export const validateTrackConfig = (config) => {
    const requiredFields = [
      'color', 'minSize', 'maxSize', 'lifespan', 'style',
      'density', 'restitution', 'spawn', 'motion'
    ];
    
    const missingFields = requiredFields.filter(field => !config[field]);
    if (missingFields.length > 0) {
      console.warn('Missing required fields in track config:', missingFields);
      return false;
    }
  
    if (config.minSize > config.maxSize) {
      console.warn('minSize is greater than maxSize in track config');
      return false;
    }
  
    return true;
  };