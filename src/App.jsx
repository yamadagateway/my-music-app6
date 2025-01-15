import { useEffect } from 'react'
import * as Tone from 'tone'
import useStore from './store'
import P5Canvas from './components/P5Canvas'
import Controls from './components/Controls'
import WelcomeModal from './components/WelcomeModal'
import PianoRoll from './components/PianoRoll'

function App() {
  const isWelcomeModalOpen = useStore(state => state.isWelcomeModalOpen)
  const isPianoRollOpen = useStore(state => state.isPianoRollOpen)
  const initializeTracks = useStore(state => state.initializeTracks)
  const cleanup = useStore(state => state.cleanup)

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
      {/* Main content */}
      {!isWelcomeModalOpen && (
        <div className="absolute inset-0 flex flex-col">
          <Controls className="z-10" />
          <div className="relative flex-1">
            <div className="absolute inset-0">
              <P5Canvas />
            </div>
            {isPianoRollOpen && (
              <div className="absolute inset-0">
                <PianoRoll />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Welcome Modal */}
      {isWelcomeModalOpen && (
        <WelcomeModal 
          onStart={async () => {
            await Tone.start()
            initializeTracks()
          }} 
        />
      )}
    </div>
  )
}

export default App