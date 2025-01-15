import React, { useEffect, useRef } from "react";
import p5 from "p5";
import useStore from "../store";
import * as Tone from "tone";

const GRID_SIZE = 32; //16nを32個で2小節分
const NOTE_HEIGHT = 16;
const PIANO_WIDTH = 8;
const TIME_WIDTH = 32;

const PianoRoll = () => {
  //ストアからの値の取得
  const selectedTrackId = useStore((state) => state.selectedTrackId); //選択中のトラック
  const isPianoRollOpen = useStore((state) => state.isPianoRollOpen); //ピアノロールが開いているか
  const closePianoRoll = useStore((state) => state.closePianoRoll); //ピアノロールが閉じたか
  const setTrackSequence = useStore((state) => state.setTrackSequence); //
  const tracks = useStore((state) => state.tracks);
  const playbackPosition = useStore((state) => state.playbackPosition); // 追加

  //参照
  const containerRef = useRef();
  const p5Instance = useRef(null);
  const selectedTrackIdRef = useRef(null);
  const tracksRef = useRef([]);
  const setTrackSequenceRef = useRef(null);
  const notesRef = useRef([]); // 利用可能なノートの配列を保持するref

  // プレビュー音の管理用ref
  const lastPreviewNoteRef = useRef(null);

  // 現在のトラックのキーレンジからノート配列を生成
  const generateNoteRange = (track) => {
    if (!track || !track.keyRange) return [];

    const lowMidi = Tone.Frequency(track.keyRange.low).toMidi();
    const highMidi = Tone.Frequency(track.keyRange.high).toMidi();

    return Array.from({ length: highMidi - lowMidi + 1 }, (_, i) => {
      const midiNote = highMidi - i;
      return Tone.Frequency(midiNote, "midi").toNote();
    });
  };

  const calculateNoteTime = (mouseX) => {
    const gridX = Math.floor((mouseX - PIANO_WIDTH) / TIME_WIDTH);
    return Math.max(0, Math.min(gridX, GRID_SIZE - 1));
  };

  useEffect(() => {
    selectedTrackIdRef.current = selectedTrackId;
    tracksRef.current = tracks;
    setTrackSequenceRef.current = setTrackSequence;

    // トラックごとのキーレンジに更新
    const selectedTrack = tracks.find((t) => t.id === selectedTrackId);
    if (selectedTrack) {
      notesRef.current = generateNoteRange(selectedTrack);
      // キャンバスのサイズを更新
      if (p5Instance.current) {
        p5Instance.current.resizeCanvas(
          PIANO_WIDTH + GRID_SIZE * TIME_WIDTH,
          notesRef.current.length * NOTE_HEIGHT
        );
      }
    }
  }, [selectedTrackId, tracks, setTrackSequence]);

  ///// playbackPositionをp5インスタンスに反映
  useEffect(() => {
    if (p5Instance.current) {
      p5Instance.current.playbackPosition = playbackPosition;
    }
  }, [playbackPosition]);

  // p5インスタンスの初期化
  useEffect(() => {
    if (!isPianoRollOpen || !containerRef.current || p5Instance.current) return;

    // ドラッグ状態の管理用変数
    let isDragging = false;
    let draggedNoteIndex = null; // インデックスで管理
    let dragMode = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let selectedNoteIndices = new Set(); // インデックスで管理
    let selectionRect = null;
    let originalNotePositions = new Map();

    // 現在選択中のトラックとそのシーケンスを取得する関数
    const getCurrentTrackData = () => {
      const track = tracksRef.current.find(
        (t) => t.id === selectedTrackIdRef.current
      );
      return {
        track,
        sequence: track?.sequence || [],
      };
    };

    const findNoteAtPosition = (x, y) => {
      const gridX = Math.floor((x - PIANO_WIDTH) / TIME_WIDTH);
      const gridY = Math.floor(y / NOTE_HEIGHT);
      const notes = notesRef.current;

      const { sequence } = getCurrentTrackData();
      const foundNotes = sequence.reduce((acc, note, index) => {
        const noteIndex = notes.indexOf(note.note);
        if (
          noteIndex === gridY &&
          gridX >= note.time &&
          gridX < note.time + note.duration
        ) {
          acc.push({ index, note });
        }
        return acc;
      }, []);

      return foundNotes.length > 0 ? foundNotes[0] : null; // 重なっている場合は一番上のノートを返す
    };

    const isNearNoteEdge = (x, note) => {
      const noteEndX = PIANO_WIDTH + (note.time + note.duration) * TIME_WIDTH;
      return Math.abs(x - noteEndX) < TIME_WIDTH / 3;
    };

    ///////////p5の描画部分//////////////////
    p5Instance.current = new p5((p) => {
      p.setup = () => {
        const notes = notesRef.current;
        const canvas = p.createCanvas(
          PIANO_WIDTH + GRID_SIZE * TIME_WIDTH,
          notes.length * NOTE_HEIGHT
        );
        canvas.parent(containerRef.current);
        p.pixelDensity(8);
        p.frameRate(60);
        p.textFont("Jost");
      };

      const drawNote = (note, index, highlighted = false) => {
        const notes = notesRef.current;
        const noteIndex = notes.indexOf(note.note);
        if (noteIndex === -1) return;

        const x = PIANO_WIDTH + note.time * TIME_WIDTH;
        const y = noteIndex * NOTE_HEIGHT;
        const width = note.duration * TIME_WIDTH;

        // ここを修正
        const isSelected = selectedNoteIndices.has(index);

        p.noStroke();
        if (isSelected) {
          p.fill("#B4FFC8");
        } else {
          p.fill(highlighted ? "#B4FFC8" : "#000000");
        }
        p.rect(x + 4, y + 4, width - 8, NOTE_HEIGHT - 8, 8);

        p.noFill();
        p.rect(x, y, width, NOTE_HEIGHT);
      };

      p.draw = () => {
        const notes = notesRef.current;
        //背景
        p.background("#FFFFFF");

        const noteAmount = 0;

        ////////////////ピアノと横線
        notes.forEach((note, i) => {
          const y = i * NOTE_HEIGHT;

          p.push();

          p.strokeWeight(1);
          p.stroke("#CBD5E1");
          p.line(0, y, p.width, y);

          p.fill(note.includes("#") ? (0, 0, 0, 0) : (0, 0, 0, 255));
          p.stroke(note.includes("#") ? (0, 0, 0, 0) : (0, 0, 0, 255));
          p.rect(0, y, PIANO_WIDTH, NOTE_HEIGHT);

          p.noFill();
          p.strokeWeight(1);

          p.textAlign(p.LEFT, p.BOTTOM);
          p.textSize(10);
          //p.text(note, 4, y + NOTE_HEIGHT );  //ノート名の表示

          p.pop();
        });

        // 縦線
        p.strokeWeight(1);
        for (let i = 0; i <= GRID_SIZE; i++) {
          const x = PIANO_WIDTH + i * TIME_WIDTH;
          if (i % 4 === 0) {
            //p.strokeCap(p.SQUARE);
            p.stroke("#000000");
            p.strokeWeight(1);
          } else {
            //p.strokeCap(p.SQUARE);
            p.stroke("#CBD5E1");
            p.strokeWeight(1);
          }
          p.push();
          p.strokeWeight(1);
          p.line(x, 0, x, p.height);
          p.pop();
        }

        /*
        notes.forEach((note, i) => {
          const value = i + 1;
          p.push();
          p.noFill();
          p.strokeWeight(1);
          p.rect(0, 0, PIANO_WIDTH, NOTE_HEIGHT * value);
          p.pop();
        });

        */

        // 現在のシーケンスを描画
        const { sequence } = getCurrentTrackData();
        sequence.forEach((note, index) => {
          const isBeingDragged = index === draggedNoteIndex;
          drawNote(note, index, isBeingDragged);
        });

        if (p.playbackPosition !== undefined) {
          const playPosition = PIANO_WIDTH + p.playbackPosition * TIME_WIDTH;

          ///再生ヘッドの描画
          p.push();
          // 位置インジケータのヘッド部分
          p.noStroke();
          p.fill("#B4FFC8");
          p.triangle(playPosition - 8, 0, playPosition + 8, 0, playPosition, 8);
          // 位置インジケータの線
          p.stroke("#B4FFC8");
          p.strokeWeight(2);
          p.line(playPosition, 0, playPosition, p.height);
          p.pop();
        }

        if (dragMode === "select" && selectionRect) {
          ///ドラッグの状態が「選択」の時、選択範囲の四角を描画
          p.noFill();
          p.stroke("#000000");
          p.strokeWeight(1);
          p.rect(
            selectionRect.x,
            selectionRect.y,
            selectionRect.width,
            selectionRect.height
          );
        }
      };

      // マウスがキャンバスから出た時の処理
      /*
      p.mouseOut = () => {
        if (lastPreviewNoteRef.current) {
          const { track } = getCurrentTrackData();
          if (track?.instrument && track.isLoaded && !track.isMuted) {
            track.instrument.triggerRelease(lastPreviewNoteRef.current);
          }
          lastPreviewNoteRef.current = null;
        }
      };
      */

      ///////マウスのインタラクション
      //1.クリック
      p.mousePressed = () => {
        dragStartX = p.mouseX;
        dragStartY = p.mouseY;

        if (p.mouseX < PIANO_WIDTH) return;

        const clickedNote = findNoteAtPosition(p.mouseX, p.mouseY);

        if (clickedNote) {
          isDragging = true;
          draggedNoteIndex = clickedNote.index;

          if (isNearNoteEdge(p.mouseX, clickedNote.note)) {
            dragMode = "resize";
            originalNotePositions.set(draggedNoteIndex, {
              duration: clickedNote.note.duration,
            });
          } else {
            dragMode = "move";
            if (
              !p.keyIsDown(p.SHIFT) &&
              !selectedNoteIndices.has(clickedNote.index)
            ) {
              selectedNoteIndices.clear();
            }
            selectedNoteIndices.add(clickedNote.index);

            const notes = notesRef.current;
            originalNotePositions.clear();
            selectedNoteIndices.forEach((index) => {
              const note = getCurrentTrackData().sequence[index];
              originalNotePositions.set(index, {
                time: note.time,
                pitchIndex: notes.indexOf(note.note),
              });
            });
          }
        } else {
          // 範囲選択の開始
          dragMode = "select";
          if (!p.keyIsDown(p.SHIFT)) {
            selectedNoteIndices.clear();
          }
          selectionRect = {
            x: dragStartX,
            y: dragStartY,
            width: 0,
            height: 0,
          };
          // 現在のシーケンスを維持
          const { sequence } = getCurrentTrackData();
          if (sequence && sequence.length > 0) {
            setTrackSequenceRef.current?.(selectedTrackIdRef.current, sequence);
          }
        }
      };

      //2.ドラッグ（セレクト, リサイズ, 移動）
      // mouseDragged 関数の修正
      // mouseDragged の修正
      p.mouseDragged = () => {
        if (dragMode === "select") {
          selectionRect = {
            x: Math.min(dragStartX, p.mouseX),
            y: Math.min(dragStartY, p.mouseY),
            width: Math.abs(p.mouseX - dragStartX),
            height: Math.abs(p.mouseY - dragStartY),
          };
          return; // 選択中はシーケンス更新しない
        }

        if (!isDragging || draggedNoteIndex === null) return;

        const { sequence } = getCurrentTrackData();
        if (!sequence) return;

        const dx = Math.floor((p.mouseX - dragStartX) / TIME_WIDTH);
        const dy = Math.floor((p.mouseY - dragStartY) / NOTE_HEIGHT);
        const notes = notesRef.current;
        let newSequence = [...sequence];
        let hasChanges = false;

        if (dragMode === "resize") {
          const originalPos = originalNotePositions.get(draggedNoteIndex);
          if (originalPos) {
            const newDuration = Math.max(1, originalPos.duration + dx);
            if (newSequence[draggedNoteIndex].duration !== newDuration) {
              newSequence[draggedNoteIndex] = {
                ...newSequence[draggedNoteIndex],
                duration: Math.min(
                  newDuration,
                  GRID_SIZE - newSequence[draggedNoteIndex].time
                ),
              };
              hasChanges = true;
            }
          }
        } else if (dragMode === "move") {
          selectedNoteIndices.forEach((index) => {
            const originalPos = originalNotePositions.get(index);
            if (originalPos) {
              const newTime = Math.max(
                0,
                Math.min(GRID_SIZE - 1, originalPos.time + dx)
              );
              const newPitchIndex = Math.max(
                0,
                Math.min(notes.length - 1, originalPos.pitchIndex + dy)
              );

              // 移動先に既に同じノートがないか確認
              const conflictingNote = newSequence.find(
                (note, i) =>
                  i !== index &&
                  note.time === newTime &&
                  note.note === notes[newPitchIndex]
              );

              if (!conflictingNote) {
                const newNote = notes[newPitchIndex];
                if (
                  newSequence[index].time !== newTime ||
                  newSequence[index].note !== newNote
                ) {
                  newSequence[index] = {
                    ...newSequence[index],
                    time: newTime,
                    note: newNote,
                  };
                  hasChanges = true;
                }
              }
            }
          });
        }

        if (hasChanges) {
          // シーケンスを即時更新
          setTrackSequenceRef.current?.(
            selectedTrackIdRef.current,
            newSequence
          );
        }
      };

      //3.マウスが離れたら
      p.mouseReleased = () => {
        if (dragMode === "select" && selectionRect) {
          const { sequence } = getCurrentTrackData();
          const notes = notesRef.current; // notesRefから現在のノート配列を取得

          sequence.forEach((note, index) => {
            const noteIndex = notes.indexOf(note.note);
            const noteX = PIANO_WIDTH + note.time * TIME_WIDTH;
            const noteY = noteIndex * NOTE_HEIGHT;

            if (
              noteX < selectionRect.x + selectionRect.width &&
              noteX + note.duration * TIME_WIDTH > selectionRect.x &&
              noteY < selectionRect.y + selectionRect.height &&
              noteY + NOTE_HEIGHT > selectionRect.y
            ) {
              selectedNoteIndices.add(index);
            }
          });
        }

        isDragging = false;
        draggedNoteIndex = null;
        dragMode = null;
        selectionRect = null;
        originalNotePositions.clear();
      };

      //4.ダブルクリックされたら

      p.doubleClicked = () => {
        if (p.mouseX < PIANO_WIDTH) return;
      
        const notes = notesRef.current;
        const time = Math.floor((p.mouseX - PIANO_WIDTH) / TIME_WIDTH);
        const noteIndex = Math.floor(p.mouseY / NOTE_HEIGHT);
      
        if (noteIndex >= 0 && noteIndex < notes.length) {
          const { track, sequence } = getCurrentTrackData();
          if (!track?.instrument || !track.isLoaded) return;
      
          const newNote = {
            note: notes[noteIndex],
            time: time,
            duration: 1,
          };
      
          const newSequence = [...sequence, newNote];
          
          // デバッグログを追加
          console.log('Adding new note:', newNote);
          console.log('New sequence:', newSequence);
          
          setTrackSequenceRef.current?.(selectedTrackIdRef.current, newSequence);

          // プレビュー音の再生
          try {
            if (track.isNoiseTrack) {
              track.instrument.trigger(undefined, "16n");
            } else {
              track.instrument.triggerAttackRelease(
                newNote.note,
                "16n",
                undefined,
                0.7
              );
            }
          } catch (error) {
            console.warn("Failed to trigger note:", error);
          }
        }
      };
      //キーへの反応
      p.keyPressed = () => {
        const { sequence } = getCurrentTrackData();

        if (p.keyCode === p.DELETE || p.keyCode === p.BACKSPACE) {
          const newSequence = sequence.filter(
            (_, index) => !selectedNoteIndices.has(index)
          );
          setTrackSequenceRef.current?.(
            selectedTrackIdRef.current,
            newSequence
          );
          selectedNoteIndices.clear();
        }
      };
    });

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
    };
  }, [isPianoRollOpen]);

  // 選択中のトラックを取得して表示名を決定
  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);
  const trackName = selectedTrack ? `${selectedTrack.name}` : "";

  if (!isPianoRollOpen) return null;

  ///p5のピアノロール部分とクローズボタン、トラック名の表記

  return (
    <div className="select-none fixed w-fit flex-col bottom-0 left-0 right-0 bg-none border-none z-20">
      <div className="w-fit h-fit flex bg-none border-none">
        <button
          onClick={closePianoRoll}
          className="select-none w-full px-4 h-full bg-none hover:bg-highlight text-primary text-lg"
        >
          ×
        </button>

        <h2 className="px-0 h-full flex text-xl text-primary">{trackName}</h2>

        <div className="select-none w-auto"></div>
      </div>
      <div className="select-none w-fit p-1  bg-primary h-flex overflow-auto">
        <div ref={containerRef} />
      </div>
    </div>
  );
};

export default PianoRoll;
