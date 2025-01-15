import useStore from '../store'

const WelcomeModal = ({ onStart }) => {
  const closeWelcomeModal = useStore(state => state.closeWelcomeModal)

  const handleStart = async () => {
    await onStart()
    closeWelcomeModal()
  }

  return (
    <div className="fixed inset-0 bg-base flex items-center justify-center p-4 z-50">
      <div className="bg-base rounded-lg p-6 text-primary max-w-md w-full">
        <h2 className="text-6xl text-center mb-4 ">Hello!</h2>
        
        <div className="space-y-36 mb-6">
          <p>This application allows you to create music visually:</p>
          
          <ul className="list-disc list-inside space-y-2">
            <li>Drag markers to change pan and filter effects</li>
            <li>Double-click markers to open the piano roll</li>
            <li>Use the controls at the top to manage playback</li>
          </ul>
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-none text-lg border-2 border-primary text-primary rounded-full px-2 py-2 hover:bg-highlight transition-colors"
        >
          Start
        </button>
      </div>
    </div>
  )
}

export default WelcomeModal