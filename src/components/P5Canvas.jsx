// P5Canvas.jsx
import React, { useEffect, useRef, useCallback } from "react";
import p5 from "p5";
import useStore from "../store";
import { createPhysicsAnimationSystem } from "./PhysicsAnimation";

const P5Canvas = () => {
  const canvasRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const dragStateRef = useRef({
    draggedTrackId: null,
    lastClickTime: 0,
  });

  const animationSystemRef = useRef(null);
  const initializationCompletedRef = useRef(false);
  const setupCompletedRef = useRef(false);

  const tracks = useStore((state) => state.tracks);
  const updateTrackPosition = useStore((state) => state.updateTrackPosition);
  const selectTrack = useStore((state) => state.selectTrack);
  const initializeTracks = useStore((state) => state.initializeTracks);

  const tracksRef = useRef(tracks);
  const updateTrackPositionRef = useRef(updateTrackPosition);

  // setupTrackCallbacks の定義を追加
  const setupTrackCallbacks = useCallback(() => {
    if (!tracksRef.current?.length || !animationSystemRef.current) {
      console.log("Cannot setup callbacks: Missing required references");
      return;
    }

    console.log(
      "Setting up track callbacks for",
      tracksRef.current.length,
      "tracks"
    );
    tracksRef.current.forEach((track) => {
      if (track.toneSequence) {
        console.log(`Setting up callback for track ${track.id}`);
        const existingCallback = track.toneSequence.callback;
        if (existingCallback) {
          console.log(`Removing existing callback for track ${track.id}`);
          track.toneSequence.callback = null;
        }

        track.toneSequence.callback = (time, note) => {
          if (track.isMuted) return;

          console.log(`Animation triggered for track ${track.id}:`, {
            time,
            note,
            position: { x: track.x, y: track.y },
          });

          if (animationSystemRef.current?.triggerAnimation) {
            animationSystemRef.current.triggerAnimation(
              track.id,
              track.x,
              track.y,
              {
                pitch: note.midi,
                velocity: note.velocity,
                duration: note.duration * 1000,
              }
            );
          }
        };
      }
    });
    console.log("Track callbacks setup completed");
  }, []);

  // トラックの初期化
  useEffect(() => {
    const initialize = async () => {
      if (initializationCompletedRef.current) {
        console.log("Track initialization already completed");
        return;
      }
      await initializeTracks();
      initializationCompletedRef.current = true;
    };

    initialize();
  }, [initializeTracks]);

  // P5インスタンスとアニメーションシステムの初期化
  useEffect(() => {
    if (!canvasRef.current || p5InstanceRef.current) return;
    console.log("Initializing P5 instance");

    // アニメーションシステムの初期化を外部で行う
    if (!animationSystemRef.current) {
      console.log("Creating animation system");
      const system = createPhysicsAnimationSystem(null); // 一時的にnullを渡す
      animationSystemRef.current = system;
      window.animationSystem = system;
      console.log("Animation system initialized globally");
    }

    p5InstanceRef.current = new p5((p) => {
      p.setup = () => {
        console.log("P5 Canvas setup starting...");
        const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
        canvas.parent(canvasRef.current);
        p.frameRate(60);
        p.pixelDensity(2);
        p.textAlign(p.CENTER, p.CENTER);
        p.textFont("Jost");

        // P5インスタンスの設定
        if (animationSystemRef.current) {
          animationSystemRef.current.setP5Instance(p);
          console.log("P5 instance set in animation system");
        }
      };

      p.draw = () => {
        p.background("#FFFFFF");

        // マーカーの描画
        tracksRef.current?.forEach((track) => {
          drawMarker(track);
        });

        // アニメーションの更新
        if (animationSystemRef.current) {
          try {
            animationSystemRef.current.update();
          } catch (error) {
            console.error("Error updating animation:", error);
          }
        }
      };

      const drawMarker = (track) => {
        if (!track) return;

        p.push();
        p.translate(track.x, track.y);
        p.noStroke();
        p.fill(track.isMuted ? "#CBD5E1" : "#CBD5E1");
        p.textSize(16);
        p.text(track.name, 0, 1);
        p.pop();
      };

      p.mousePressed = () => {
        if (!tracksRef.current) return;

        const clickedTrack = tracksRef.current.find((track) => {
          const d = p.dist(p.mouseX, p.mouseY, track.x, track.y);
          return d < 20;
        });

        if (clickedTrack) {
          const currentTime = Date.now();
          if (currentTime - dragStateRef.current.lastClickTime < 300) {
            selectTrack(clickedTrack.id);
          }
          dragStateRef.current.lastClickTime = currentTime;
          dragStateRef.current.draggedTrackId = clickedTrack.id;
          p.cursor(p.CROSS);
        }
      };

      p.mouseDragged = () => {
        const { draggedTrackId } = dragStateRef.current;
        if (draggedTrackId !== null && updateTrackPositionRef.current) {
          const x = p.constrain(p.mouseX, 0, p.width);
          const y = p.constrain(p.mouseY, 0, p.height);

          updateTrackPositionRef.current(draggedTrackId, x, y);

          if (animationSystemRef.current) {
            animationSystemRef.current.updateTrackPosition(
              draggedTrackId,
              x,
              y
            );
          }
        }
      };

      p.mouseReleased = () => {
        dragStateRef.current.draggedTrackId = null;
        p.cursor(p.ARROW);
      };

      p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
      };
    });

    // クリーンアップ
    return () => {
        console.log("Cleaning up P5 Canvas");
        if (p5InstanceRef.current) {
          p5InstanceRef.current.remove();
          p5InstanceRef.current = null;
        }
        setupCompletedRef.current = false;
      };
    }, []);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    if (
      !tracks.length ||
      !animationSystemRef.current ||
      setupCompletedRef.current
    ) {
      return;
    }

    setupTrackCallbacks();
    setupCompletedRef.current = true;
  }, [tracks, setupTrackCallbacks]);

  useEffect(() => {
    updateTrackPositionRef.current = updateTrackPosition;
  }, [updateTrackPosition]);

  // アプリケーション終了時のクリーンアップ
  useEffect(() => {
    return () => {
      if (animationSystemRef.current) {
        animationSystemRef.current.cleanup();
        window.animationSystem = null;
        animationSystemRef.current = null;
      }
    };
  }, []);

  return <div ref={canvasRef} className="select-none absolute inset-0" />;
};

export default P5Canvas;
