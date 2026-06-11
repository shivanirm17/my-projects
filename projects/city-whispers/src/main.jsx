import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// No StrictMode: its dev-only double-mount creates the Mapbox map twice,
// burning two map loads per refresh.
createRoot(document.getElementById('root')).render(<App />)
