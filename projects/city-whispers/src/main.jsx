import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminApp from './components/admin/AdminApp.jsx'

// No StrictMode: its dev-only double-mount creates the Mapbox map twice,
// burning two map loads per refresh.
const isAdmin = window.location.pathname === '/admin'

createRoot(document.getElementById('root')).render(
  isAdmin ? <AdminApp /> : <App />
)
