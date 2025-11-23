import { useState, useEffect } from 'react'
import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { base } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { RainbowKitProvider, getDefaultWallets, connectorsForWallets } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'

import GeneratorScreen from './components/GeneratorScreen'
import CurationScreen from './components/CurationScreen'
import './App.css'

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [base],
  [publicProvider()]
)

// Configure wallet connectors (Coinbase Wallet priority)
const { wallets } = getDefaultWallets({
  appName: 'Pepe Card Generator',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get from WalletConnect Cloud
  chains,
})

const connectors = connectorsForWallets([
  ...wallets,
])

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
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
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains}>
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
    </WagmiConfig>
  )
}

export default App
