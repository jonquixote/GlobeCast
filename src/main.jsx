import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import TestDataPage from './TestDataPage.jsx'
import './App.css'

// For testing purposes, we can switch between App and TestDataPage
const isTesting = false; // Set to true to view data visualization

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isTesting ? <TestDataPage /> : <App />}
  </React.StrictMode>,
)
