import useStore from "../store";
import * as Tone from "tone"; // Toneをインポート

const Controls = () => {
  const isPlaying = useStore((state) => state.isPlaying);
  const bpm = useStore((state) => state.bpm);
  const metronomeEnabled = useStore((state) => state.metronomeEnabled);
  const togglePlay = useStore((state) => state.togglePlay);
  const setBpm = useStore((state) => state.setBpm);
  const toggleMetronome = useStore((state) => state.toggleMetronome);

  const handleMetronomeToggle = async () => {
    console.log("Metronome toggle clicked, current state:", metronomeEnabled);

    // AudioContextが suspended の場合は再開
    if (Tone.context.state !== "running") {
      await Tone.start();
    }

    toggleMetronome();

    // 状態変更の確認
    setTimeout(() => {
      console.log(
        "Metronome state after toggle:",
        useStore.getState().metronomeEnabled
      );
      console.log("Transport state:", Tone.Transport.state);
    }, 0);
  };

  return (
    <div className="select-none fixed bottom-0 right-0 bg-none border-none z-10">
      <div className="max-w-screen-xl mx-auto px-0 py-0 flex">
        {/* Transport Controls */}

        {/* BPM Control */}

        <div className="flex items-center  bg-none p-0">
          <label htmlFor="bpm" className="w-100 text-primary text-lg">
            bpm = {bpm}
          </label>
          <div className="flex items-center mr-12">
            <input
              id="bpm"
              type="range"
              min="40"
              max="200"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-24 h-1 bg-primary rounded-full appearance-none accent-primary"
            />
          </div>

          {/* Metronome Toggle */}
          <button
            onClick={handleMetronomeToggle}
            className={`
          w-100 text-xl items-center rounded-full mr-8
          
          ${metronomeEnabled ? "bg-none text-primary" : "bg-primary text-base"}
        `}
          >
            <span>Metro {metronomeEnabled ? "ON" : "OFF"}</span>
          </button>

          <button
            onClick={togglePlay}
            className={`
              flex items-center justify-center
              w-48 h-48 
            
              ${
                isPlaying ? "bg-highlight text-primary" : "bg-secondary text-primary"
              }
            `}
          >
            <span className="sr-only">{isPlaying ? "Stop" : "Play"}</span>
            {isPlaying ? (
              <svg
                className="w-24 h-24"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="7" y="5" width="4" height="14" />
                <rect x="13" y="5" width="4" height="14" />
              </svg>
            ) : (
              <svg
                className="w-24 h-24"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;
