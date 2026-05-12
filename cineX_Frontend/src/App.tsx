import './index.css'
import TheatreLayoutBuilder from './components/TheatreLayoutBuilder'

function App() {
  return (
    <div className="min-h-screen bg-[#F4F2EE] dark:bg-[#1C1C1A] p-6">
      <TheatreLayoutBuilder
        onSave={(data) => {
          console.log('Layout saved:', data)
          alert(`Layout saved! ${data.layout.length} items, ${data.aisles.length} aisles`)
        }}
      />
    </div>
  )
}

export default App
