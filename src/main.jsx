
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import Mainroutes from './Router/Mainroutes.jsx'

createRoot(document.getElementById('root')).render(
 
  <BrowserRouter>
  <Mainroutes/>
  </BrowserRouter>
)
