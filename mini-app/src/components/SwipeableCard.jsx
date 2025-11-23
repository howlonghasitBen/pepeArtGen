import { useSpring, animated } from 'react-spring'
import { useDrag } from '@use-gesture/react'
import './SwipeableCard.css'

function SwipeableCard({ card, onSwipeLeft, onSwipeRight }) {
  const [{ x, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    rotate: 0,
    scale: 1,
  }))

  const bind = useDrag(
    ({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
      const trigger = vx > 0.2 || Math.abs(mx) > 100

      if (!active && trigger) {
        // Swipe completed
        if (xDir > 0) {
          onSwipeRight()
        } else {
          onSwipeLeft()
        }
        api.start({ x: xDir > 0 ? 1000 : -1000, rotate: xDir * 50, scale: 0.8 })
      } else {
        // Dragging or released without trigger
        api.start({
          x: active ? mx : 0,
          rotate: active ? mx / 10 : 0,
          scale: active ? 1.05 : 1,
        })
      }
    },
    {
      axis: 'x',
      bounds: { left: -300, right: 300 },
      rubberband: true,
    }
  )

  // Color indicators during swipe
  const leftColor = x.to(
    [-300, 0],
    ['rgba(255, 59, 48, 0.8)', 'rgba(255, 59, 48, 0)']
  )
  const rightColor = x.to(
    [0, 300],
    ['rgba(76, 217, 100, 0)', 'rgba(76, 217, 100, 0.8)']
  )

  return (
    <animated.div
      {...bind()}
      className="swipeable-card"
      style={{
        x,
        rotate,
        scale,
        touchAction: 'none',
      }}
    >
      <animated.div className="swipe-overlay left" style={{ backgroundColor: leftColor }}>
        <span className="overlay-icon">✗</span>
        <span className="overlay-text">DISCARD</span>
      </animated.div>

      <animated.div className="swipe-overlay right" style={{ backgroundColor: rightColor }}>
        <span className="overlay-text">MINT</span>
        <span className="overlay-icon">✓</span>
      </animated.div>

      <div
        className="card-content"
        style={{
          background: card.theme?.background || 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
        }}
      >
        <div
          className="card-image-container"
          style={{
            background: card.theme?.imageArea?.background,
            border: card.theme?.imageArea?.border,
            boxShadow: card.theme?.imageArea?.boxShadow,
          }}
        >
          <img src={card.imageData} alt={card.name} className="card-image" />
        </div>

        <div className="card-details">
          <h2
            className="card-name"
            style={{
              background: card.theme?.header?.background,
              color: card.theme?.header?.color,
              textShadow: card.theme?.header?.textShadow,
              boxShadow: card.theme?.header?.boxShadow,
            }}
          >{card.name}</h2>

          <div className="card-stats">
            <div className="stat" style={{
              background: card.theme?.stat?.background,
              border: card.theme?.stat?.border,
              color: card.theme?.stat?.color,
              boxShadow: card.theme?.stat?.boxShadow,
            }}>
              <span className="stat-label">LVL</span>
              <span className="stat-value">{card.stats.level}</span>
            </div>
            <div className="stat" style={{
              background: card.theme?.stat?.background,
              border: card.theme?.stat?.border,
              color: card.theme?.stat?.color,
              boxShadow: card.theme?.stat?.boxShadow,
            }}>
              <span className="stat-label">ATK</span>
              <span className="stat-value">{card.stats.attack}</span>
            </div>
            <div className="stat" style={{
              background: card.theme?.stat?.background,
              border: card.theme?.stat?.border,
              color: card.theme?.stat?.color,
              boxShadow: card.theme?.stat?.boxShadow,
            }}>
              <span className="stat-label">DEF</span>
              <span className="stat-value">{card.stats.defense}</span>
            </div>
            <div className="stat" style={{
              background: card.theme?.stat?.background,
              border: card.theme?.stat?.border,
              color: card.theme?.stat?.color,
              boxShadow: card.theme?.stat?.boxShadow,
            }}>
              <span className="stat-label">HP</span>
              <span className="stat-value">{card.stats.hp}</span>
            </div>
            <div className="stat" style={{
              background: card.theme?.stat?.background,
              border: card.theme?.stat?.border,
              color: card.theme?.stat?.color,
              boxShadow: card.theme?.stat?.boxShadow,
            }}>
              <span className="stat-label">MANA</span>
              <span className="stat-value">{card.stats.manaCost}</span>
            </div>
          </div>

          <div className="card-move">
            <div className="move-label">SIGNATURE MOVE</div>
            <div className="move-name">{card.move}</div>
          </div>

          <div className="card-flavor">
            <p>{card.flavorText}</p>
          </div>
        </div>
      </div>
    </animated.div>
  )
}

export default SwipeableCard
