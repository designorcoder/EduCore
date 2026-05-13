import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AppProvider } from './context/AppContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { TranslationProvider } from './context/TranslationContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <TranslationProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </TranslationProvider>
    </AuthProvider>
  </React.StrictMode>,
)
