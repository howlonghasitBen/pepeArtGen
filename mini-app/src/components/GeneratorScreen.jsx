import { useState } from 'react'
import './GeneratorScreen.css'

function GeneratorScreen({ onCardsGenerated, limits }) {
  const [mode, setMode] = useState('single') // 'single' or 'batch'
  const [monsterName, setMonsterName] = useState('')
  const [batchNames, setBatchNames] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const handleGenerate = async () => {
    setError('')
    setLoading(true)
    setProgress({ current: 0, total: 0 })

    try {
      let monsterNames = []

      if (mode === 'single') {
        if (!monsterName.trim()) {
          setError('Please enter a monster name')
          setLoading(false)
          return
        }
        monsterNames = [monsterName.trim()]
      } else {
        // Parse batch input (comma or newline separated)
        const names = batchNames
          .split(/[,\n]/)
          .map(name => name.trim())
          .filter(name => name.length > 0)

        if (names.length === 0) {
          setError('Please enter at least one monster name')
          setLoading(false)
          return
        }

        if (limits && names.length > limits.batchLimit) {
          setError(`Batch limit is ${limits.batchLimit} cards`)
          setLoading(false)
          return
        }

        if (limits && names.length > limits.remaining) {
          setError(`Not enough generations remaining (${limits.remaining} left)`)
          setLoading(false)
          return
        }

        monsterNames = names
      }

      setProgress({ current: 0, total: monsterNames.length })

      // Call API to generate cards with Imagen
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monsterNames,
          batchMode: mode === 'batch',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Generation failed')
      }

      const data = await response.json()

      if (data.success) {
        onCardsGenerated(data.cards)
        setMonsterName('')
        setBatchNames('')
      } else {
        setError('Generation failed')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exampleMonsters = [
    'Shadow Dragon',
    'Crystal Golem',
    'Void Reaper',
    'Lightning Phoenix',
    'Frost Giant',
  ]

  const handleExampleClick = (name) => {
    setMonsterName(name)
    setMode('single')
  }

  const batchLimit = limits?.batchLimit || 10
  const remaining = limits?.remaining || 0

  return (
    <div className="generator-screen">
      <div className="mode-selector">
        <button
          className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
          onClick={() => setMode('single')}
        >
          Single Card
        </button>
        <button
          className={`mode-btn ${mode === 'batch' ? 'active' : ''}`}
          onClick={() => setMode('batch')}
        >
          Batch ({batchLimit} max)
        </button>
      </div>

      {mode === 'single' ? (
        <div className="input-section">
          <label htmlFor="monsterName">Monster Name</label>
          <input
            id="monsterName"
            type="text"
            placeholder="Enter monster name..."
            value={monsterName}
            onChange={(e) => setMonsterName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleGenerate()}
            disabled={loading}
            className="monster-input"
          />

          <div className="examples">
            <p className="examples-label">Try these:</p>
            <div className="example-chips">
              {exampleMonsters.map((name) => (
                <button
                  key={name}
                  className="example-chip"
                  onClick={() => handleExampleClick(name)}
                  disabled={loading}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="input-section">
          <label htmlFor="batchNames">
            Monster Names (one per line or comma-separated)
          </label>
          <textarea
            id="batchNames"
            placeholder={`Fire Dragon\nIce Wizard\nShadow Assassin\n\nOr: Fire Dragon, Ice Wizard, Shadow Assassin`}
            value={batchNames}
            onChange={(e) => setBatchNames(e.target.value)}
            disabled={loading}
            className="batch-input"
            rows={8}
          />
          <div className="batch-count">
            {batchNames.split(/[,\n]/).filter(n => n.trim()).length} / {batchLimit} cards
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="spinner" />
          <p className="loading-text">
            {progress.total > 0
              ? `Generating cards... (${progress.current}/${progress.total})`
              : 'Generating cards...'}
          </p>
          <p className="loading-subtext">This may take a minute...</p>
        </div>
      )}

      <button
        className="generate-btn"
        onClick={handleGenerate}
        disabled={loading || remaining === 0}
      >
        {loading ? 'Generating...' : `🎨 Generate Card${mode === 'batch' ? 's' : ''}`}
      </button>

      {remaining === 0 && (
        <div className="limit-warning">
          Daily limit reached. Resets in 24 hours.
        </div>
      )}

      <div className="info-box">
        <h3>How it works:</h3>
        <ol>
          <li>Enter monster name(s)</li>
          <li>AI generates unique card art</li>
          <li>Swipe left to discard ⬅️</li>
          <li>Swipe right to mint on BASE ➡️</li>
          <li>Minting costs 1 USDC</li>
        </ol>
      </div>
    </div>
  )
}

export default GeneratorScreen
