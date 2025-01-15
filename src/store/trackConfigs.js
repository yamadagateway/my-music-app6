export const TRACK_CONFIGS = [
  {
    name: "Kick",
    volume: -6,
    synth: {
      type: "MembraneSynth",
      options: {
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: {
          type: "sine",
        },
        envelope: {
          attack: 0.05,
          decay: 0.2,
          sustain: 0.0,
          release: 1,
          attackCurve: "exponential",
        },
      },
    },
    effects: [
      {
        type: "Filter",
        options: {
          frequency: 600,
          type: "lowpass",
          rolloff: -24,
        },
      },
    ],
    keyRange: {
      low: "C1",
      high: "C2",
    },
  },
  {
    name: "Drums",
    volume: -6,
    sampler: {
      options: {
        urls: {
          C2: "CR-78Kit_0.wav",
          D2: "CR-78Kit_2.wav",
          E2: "CR-78Kit_4.wav",
          F2: "CR-78Kit_6.wav",
        },
        baseUrl: "src/store/samples/CR-78-samples/",
        release: 1, // リリース時間を追加
        attack: 0, // アタック時間を追加
      },
    },
    effects: [
      {
        type: "Compressor",
        options: {
          threshold: -20,
          ratio: 4,
        },
      },
    ],
    keyRange: {
      low: "C2",
      high: "F2",
    },
  },
  {
    name: "Lead",
    volume: -4,
    synth: {
      type: "FMSynth",
      options: {
        harmonicity: 2,
        modulationIndex: 3,
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.8,
          release: 0.1,
        },
      },
    },
    effects: [
      {
        type: "Filter",
        options: {
          frequency: 2000,
          type: "lowpass",
        },
      },
      {
        type: "Reverb",
        options: {
          decay: 1.5,
          wet: 0.3,
        },
      },
    ],
    keyRange: {
      low: "C4",
      high: "C6",
    },
  },
  {
    name: "Pad",
    volume: -0,
    synth: {
      type: "PolySynth",
      options: {
        polyphony: 6,
        oscillator: {
          type: "sine",
        },
        envelope: {
          attack: 0.5,
          decay: 0.3,
          sustain: 0.0,
          release: 0.2,
        },
      },
    },
    effects: [
      {
        type: "Chorus",
        options: {
          frequency: 4,
          delayTime: 2.5,
          depth: 0.7,
          wet: 0.5,
        },
      },
      {
        type: "Reverb",
        options: {
          decay: 4,
          wet: 0.6,
        },
      },
    ],
    keyRange: {
      low: "C3",
      high: "C5",
    },
  },
  {
    name: "Arp",
    volume: -6, // アルペジオは中程度の音量で
    synth: {
      type: "MonoSynth",
      options: {
        oscillator: {
          type: "square",
        },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.3,
          release: 0.1,
        },
      },
    },
    effects: [
      {
        type: "PingPongDelay",
        options: {
          delayTime: "8n",
          feedback: 0.3,
          wet: 0.3,
        },
      },
    ],
    keyRange: {
      low: "C4",
      high: "C6",
    },
  },
  {
    name: "Noise",
    volume: -12,
    synth: {
      type: "Noise",
      options: {
        type: "white",
        playbackRate: 1,
      },
      envelope: {
        // エンベロープをsynth設定の中に移動
        attack: 0.005,
        decay: 0.1,
        sustain: 0.1,
        release: 0.5,
      },
    },
    effects: [
      {
        type: "Filter",
        options: {
          frequency: 1000,
          type: "bandpass",
          Q: 2,
        },
      },
    ],
    keyRange: {
      low: "C1",
      high: "C2",
    },
  },
  {
    name: "Noise2",
    volume: -12,
    synth: {
      type: "Noise",
      options: {
        type: "white",
        playbackRate: 1,
      },
      envelope: {
        // エンベロープをsynth設定の中に移動
        attack: 0.005,
        decay: 0.1,
        sustain: 0.1,
        release: 0.5,
      },
    },
    effects: [
      {
        type: "Filter",
        options: {
          frequency: 1000,
          type: "bandpass",
          Q: 2,
        },
      },
    ],
    keyRange: {
      low: "C1",
      high: "C2",
    },
  },
];
