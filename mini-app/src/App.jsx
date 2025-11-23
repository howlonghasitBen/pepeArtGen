import { useState, useEffect } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

import GeneratorScreen from './components/GeneratorScreen'
import CurationScreen from './components/CurationScreen'
import './App.css'

// Get WalletConnect Project ID from env (optional for now)
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

// Configure Wagmi with RainbowKit (wallet connection optional)
const config = getDefaultConfig({
  appName: 'Pepe Card Generator',
  projectId,
  chains: [base, baseSepolia],
  ssr: false,
})

const queryClient = new QueryClient()

function App() {
  const [screen, setScreen] = useState('generate') // 'generate' or 'curate'
  const [generatedCards, setGeneratedCards] = useState([])
  const [limits, setLimits] = useState(null)

  useEffect(() => {
    fetchLimits()
  }, [])

  const fetchLimits = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/limits')
      const data = await response.json()
      setLimits(data)
    } catch (error) {
      console.error('Error fetching limits:', error)
    }
  }

  const handleCardsGenerated = (cards) => {
    setGeneratedCards(cards.filter(card => !card.error))
    setScreen('curate')
    fetchLimits()
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="app">
            <header className="app-header">
              <h1>🃏 Pepe Card Generator</h1>
              <p className="subtitle">Swipe to curate, mint on BASE</p>
              {limits && (
                <div className="limits-badge">
                  {limits.remaining}/{limits.dailyLimit} free gens remaining
                </div>
              )}
            </header>

            {screen === 'generate' ? (
              <GeneratorScreen
                onCardsGenerated={handleCardsGenerated}
                limits={limits}
              />
            ) : (
              <CurationScreen
                cards={generatedCards}
                onBack={() => setScreen('generate')}
              />
            )}
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
