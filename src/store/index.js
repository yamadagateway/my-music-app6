// store/index.js
import { create } from "zustand";
import * as Tone from "tone";
import { TRACK_CONFIGS } from "./trackConfigs";

// メトロノーム作成関数の修正
const createMetronome = () => {
  const synth = new Tone.MembraneSynth({
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
    pitchDecay: 0.01,
    octaves: 2,
    volume: -12,
  }).toDestination();

  const loop = new Tone.Loop((time) => {
    synth.triggerAttackRelease("C4", "16n", time);
  }, "4n");

  return {
    start: () => {
      if (Tone.Transport.state === "started") {
        loop.start();
      }
    },
    stop: () => loop.stop(),
    dispose: () => {
      loop.stop();
      loop.dispose();
      synth.dispose();
    },
  };
};

const initializeSampler = (config) => {
  return new Promise((resolve, reject) => {
    const instrument = new Tone.Sampler({
      ...config.sampler.options,
      onload: () => resolve(instrument),
      onerror: (error) => reject(error),
    }).toDestination();
  });
};

const createTrack = async (id) => {
  const config = TRACK_CONFIGS[id];
  let instrument;
  let effectChain = [];
  //let audioNodes = []; // オーディオノードを保持する配列を追加

  if (config.synth) {
    if (config.synth.type === "Noise") {
      ///ノイズに特有の実装
      const noise = new Tone.Noise({
        type: config.synth.options.type,
        volume: config.volume,
        playbackRate: config.synth.options.playbackRate,
      });

      const envelope = new Tone.AmplitudeEnvelope({
        attack: config.synth.envelope.attack,
        decay: config.synth.envelope.decay,
        sustain: config.synth.envelope.sustain,
        release: config.synth.envelope.release,
      });

      // フィルターとパンナーを先に作成
      const filter = new Tone.Filter(1000, "lowpass");
      const panner = new Tone.Panner(0);
      effectChain.push(filter, panner);

      // その他のエフェクトを作成
      config.effects.forEach((effect) => {
        const toneEffect = new Tone[effect.type](effect.options);
        effectChain.push(toneEffect);
      });

      // シグナルチェーンを明示的に構築
      noise.connect(envelope).connect(filter).connect(panner);

      // 残りのエフェクトを接続
      let currentNode = panner;
      effectChain.slice(2).forEach((effect) => {
        currentNode.connect(effect);
        currentNode = effect;
      });

      currentNode.connect(Tone.Destination);

      // ノイズは必要なときにのみトリガー
      instrument = {
        noise,
        envelope,
        loaded: true,
        trigger: (time, duration) => {
          noise.start(time);
          envelope.triggerAttackRelease(duration, time);
          noise.stop(time + duration); // duration後に停止
        },
      };
    } else {
      // 通常のシンセサイザー
      instrument = new Tone[config.synth.type](config.synth.options);
      instrument.loaded = true;
      instrument.volume.value = config.volume;

      // エフェクトの作成
      config.effects.forEach((effect) => {
        const toneEffect = new Tone[effect.type](effect.options);
        effectChain.push(toneEffect);
      });

      const panner = new Tone.Panner(0);
      const filter = new Tone.Filter(1000, "lowpass");
      effectChain.push(panner, filter);

      // 通常の接続
      instrument.chain(...effectChain, Tone.Destination);
    }
  } else if (config.sampler) {
    instrument = await initializeSampler(config);
    instrument.volume.value = config.volume;

    // エフェクトの作成
    config.effects.forEach((effect) => {
      const toneEffect = new Tone[effect.type](effect.options);
      effectChain.push(toneEffect);
    });

    const panner = new Tone.Panner(0);
    const filter = new Tone.Filter(1000, "lowpass");
    effectChain.push(panner, filter);

    instrument.chain(...effectChain, Tone.Destination);
  }

  // 残りの部分は変更なし
  return {
    id,
    name: config.name,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    instrument,
    effects: effectChain,
    panner: effectChain[effectChain.length - 2],
    filter: effectChain[effectChain.length - 1],
    sequence: [],
    isMuted: false,
    isPlaying: false,
    toneSequence: null,
    keyRange: config.keyRange,
    isNoiseTrack: Boolean(config.synth?.type === "Noise"),

    /////ノート番号を周波数に変換
    midiNoteToFrequency: (note) => {
      const freq = Tone.Frequency(note).toFrequency();
      return Math.max(100, Math.min(8000, freq));
    },

    get isLoaded() {
      // Sampler の場合は loaded プロパティを確認
      if (this.instrument instanceof Tone.Sampler) {
        return this.instrument.loaded;
      }
      // その他のインストゥルメントの場合は常に true
      return true;
    },
  };
};

const useStore = create((set, get) => {
  let metronome = null;
  let sequenceDisposalTimeout = null; // シーケンス破棄のタイマーを管理

  console.log("Initializing Tone.js...");

  Tone.start()
    .then(() => {
      console.log("Tone.js started successfully.");
    })
    .catch((error) => {
      console.error("Error starting Tone.js:", error);
    });

  return {
    // Global state
    isPlaying: false,
    bpm: 120,
    playbackPosition: 0,
    metronomeEnabled: false,
    selectedTrackId: null,

    // Tracks state
    tracks: [],

    // Modal state
    isWelcomeModalOpen: true,
    isPianoRollOpen: false,

    // Actions
    initializeTracks: async () => {
      console.log("TRACK_CONFIGS length:", TRACK_CONFIGS.length); // 追加
      console.log("TRACK_CONFIGS:", TRACK_CONFIGS); // 追加

      console.log("Starting initializeTracks..."); // 追加
      try {
        await Tone.start();
        console.log("Tone.js started, creating tracks..."); // 追加

        const newTracks = [];
        for (let i = 0; i < TRACK_CONFIGS.length; i++) {
          console.log(`Creating track ${i}...`); // 追加
          const track = await createTrack(i);
          console.log(`Track ${i} created:`, track); // 追加
          newTracks.push(track);
        }

        console.log("All tracks created, updating state:", newTracks); // 追加
        set({ tracks: newTracks });
      } catch (error) {
        console.error("Error initializing tracks:", error);
      }
    },

    updateTrackPosition: (id, x, y) => {
      set((state) => {
        const newTracks = state.tracks.map((track) => {
          if (track.id === id) {
            const normalizedPan = (x / window.innerWidth) * 2 - 1;
            const normalizedFilter = 1 - y / window.innerHeight;

            track.panner.pan.value = normalizedPan;
            track.filter.frequency.value = normalizedFilter * 10000 + 100;

            return {
              ...track,
              x: x,
              y: y,
            };
          }
          return track;
        });

        return { tracks: newTracks };
      });
    },

    //////////トラックごとのシーケンスを管理

    // setTrackSequence内のアニメーション関連部分を修正
    setTrackSequence: (id, sequence) => {
        console.log(`Setting sequence for track ${id}:`, sequence);
        console.log('Current Transport state:', Tone.Transport.state);
        console.log('Animation system available:', Boolean(window.animationSystem));
        
        set((state) => ({
          tracks: state.tracks.map((track) => {
            if (track.id === id) {
              if (track.toneSequence) {
                console.log("Disposing existing sequence");
                track.toneSequence.dispose();
              }
      
              const sixteenthNote = Tone.Time("16n").toSeconds();
              console.log("Sixteenth note duration:", sixteenthNote);
              
              try {
                const events = sequence.map((note) => {
                  const time = `0:${Math.floor(note.time / 4)}:${note.time % 4}`;
                  return {
                    time,
                    note: note.note,
                    duration: note.duration,
                    velocity: 0.7,
                  };
                });
      
                console.log(`Created ${events.length} events for track ${id}`);
      
                const tonePart = new Tone.Part((time, event) => {
                  console.log(`Part callback triggered for track ${id}:`, {
                    time,
                    note: event.note,
                    isMuted: track.isMuted
                  });
      
                  if (!track.isMuted) {
                    try {
                      const noteDuration = sixteenthNote * event.duration;
      
                      // 音の再生
                      if (track.isNoiseTrack) {
                        console.log(`Triggering noise track ${id}`);
                        track.instrument.trigger(time, noteDuration);
                      } else {
                        console.log(`Triggering melodic track ${id}`);
                        track.instrument.triggerAttackRelease(
                          event.note,
                          noteDuration,
                          time,
                          event.velocity
                        );
                      }
      
                      // アニメーション処理
                      Tone.Draw.schedule(() => {
                        console.log(`Draw.schedule callback triggered for track ${id}`);
                        
                        const currentTrack = get().tracks.find((t) => t.id === id);
                        console.log('Current track position:', currentTrack ? { x: currentTrack.x, y: currentTrack.y } : 'not found');
                        
                        const animationSystem = window.animationSystem;
                        console.log('Animation system check:', {
                          exists: Boolean(animationSystem),
                          hasMethod: Boolean(animationSystem?.triggerAnimation)
                        });
      
                        if (currentTrack && animationSystem?.triggerAnimation) {
                          const midiNote = typeof event.note === "string"
                            ? Tone.Frequency(event.note).toMidi()
                            : event.note;
      
                          console.log('Preparing animation trigger:', {
                            trackId: track.id,
                            position: { x: currentTrack.x, y: currentTrack.y },
                            note: {
                              original: event.note,
                              midi: midiNote,
                              velocity: event.velocity,
                              duration: noteDuration * 1000
                            }
                          });
      
                          try {
                            animationSystem.triggerAnimation(
                              track.id,
                              currentTrack.x,
                              currentTrack.y,
                              {
                                pitch: midiNote,
                                velocity: event.velocity,
                                duration: noteDuration * 1000,
                              }
                            );
                            console.log(`Animation successfully triggered for track ${id}`);
                          } catch (error) {
                            console.error('Error triggering animation:', error);
                          }
                        } else {
                          console.warn(`Could not trigger animation for track ${id}:`, {
                            trackExists: Boolean(currentTrack),
                            animationSystemExists: Boolean(animationSystem),
                            hasMethod: Boolean(animationSystem?.triggerAnimation)
                          });
                        }
                      }, time);
      
                    } catch (error) {
                      console.error(`Error in Part callback for track ${id}:`, error);
                    }
                  }
                }, events);
      
                tonePart.loop = true;
                tonePart.loopEnd = "2:0:0";
      
                if (get().isPlaying) {
                  console.log(`Starting sequence immediately for track ${id}`);
                  tonePart.start(0);
                } else {
                  console.log(`Sequence created but not started for track ${id} (playback is stopped)`);
                }
      
                return { ...track, sequence, toneSequence: tonePart };
              } catch (error) {
                console.error(`Error creating sequence for track ${id}:`, error);
                return track;
              }
            }
            return track;
          }),
        }));
      },

    /*toggleTrackMute: (id) => {
      set((state) => ({
        tracks: state.tracks.map((track) => {
          if (track.id === id) {
            if (track.isMuted) {
              track.instrument.volume.value = config.volume;
            } else {
              track.instrument.volume.value = -Infinity;
            }
            return { ...track, isMuted: !track.isMuted };
          }
          return track;
        }),
      }));
    },
    */

    togglePlay: () => {
      const currentlyPlaying = !get().isPlaying;
      console.log("Toggling playback. Currently playing:", currentlyPlaying);

      if (currentlyPlaying) {
        console.log("Starting playback...");

        // 全トラックのシーケンスを確認
        get().tracks.forEach((track) => {
          // トラックにシーケンスデータがある場合
          if (track.sequence && track.sequence.length > 0) {
            if (!track.toneSequence) {
              // シーケンスがまだ作成されていない場合は新規作成
              console.log(`Creating new sequence for track ${track.id}`);
              get().setTrackSequence(track.id, track.sequence);
            } else {
              // 既存のシーケンスがある場合は再開
              console.log(`Starting existing sequence for track ${track.id}`);
              track.toneSequence.start(0);
            }
          }
        });

        // Transportを開始
        console.log("Starting Tone.Transport...");
        Tone.Transport.start();

        // メトロノームの処理 (変更なし)
        if (get().metronomeEnabled && metronome) {
          console.log("Starting metronome...");
          metronome.start();
        }

        // 再生位置の更新 (変更なし)
        const intervalId = setInterval(() => {
          const sixteenthNote = Tone.Transport.PPQ / 4;
          const currentTick = Tone.Transport.ticks;
          const position = Math.floor(currentTick / sixteenthNote) % 32;
          set({ playbackPosition: position });
        }, 16);

        set({ isPlaying: true, playbackIntervalId: intervalId });
      } else {
        console.log("Stopping playback...");

        if (get().playbackIntervalId) {
          clearInterval(get().playbackIntervalId);
        }

        // メトロノームが有効な場合は停止
        if (metronome) {
          metronome.stop();
        }

        Tone.Transport.stop();
        set({ isPlaying: false, playbackPosition: 0 });
      }
    },

    setBpm: (bpm) => {
      Tone.Transport.bpm.value = bpm;
      set({ bpm });
    },

    initializeMetronome: async () => {
      console.log("Initializing metronome...");
      try {
        if (metronome) {
          metronome.cleanup();
        }

        await Tone.start();
        metronome = createMetronome();

        // 現在の状態に応じてメトロノームを設定
        if (get().metronomeEnabled) {
          metronome.setVolume(true);
          if (get().isPlaying) {
            metronome.start();
          }
        } else {
          metronome.setVolume(false);
        }

        console.log("Metronome initialized successfully");
      } catch (error) {
        console.error("Error initializing metronome:", error);
      }
    },

    // メトロノームの状態管理と操作
    toggleMetronome: () => {
      const newState = !get().metronomeEnabled;

      // メトロノームがない場合は作成
      if (!metronome) {
        metronome = createMetronome();
      }

      // 状態に応じた操作
      if (newState && get().isPlaying) {
        metronome.start();
      } else {
        metronome.stop();
      }

      set({ metronomeEnabled: newState });
    },

    selectTrack: (id) => {
      set({
        selectedTrackId: id,
        isPianoRollOpen: true,
      });
    },

    closeWelcomeModal: () => {
      set({ isWelcomeModalOpen: false });
    },

    closePianoRoll: () => {
      set({
        isPianoRollOpen: false,
        selectedTrackId: null,
      });
    },

    cleanup: () => {
      get().tracks.forEach((track) => {
        if (track.toneSequence) {
          track.toneSequence.dispose();
        }
        track.instrument.dispose();
        track.filter.dispose();
        track.panner.dispose();
      });
      if (metronome) {
        metronome.cleanup();
        metronome = null;
      }
      set({ tracks: [] });
    },
  };
});

export default useStore;
