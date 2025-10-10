import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Trophy } from 'lucide-react';
import '../styles/GamePages.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LEVELS = [
  {
    level: 1,
    items: [
      { name: 'Plastic Bottle', type: 'recyclable', emoji: '🍾' },
      { name: 'Banana Peel', type: 'organic', emoji: '🍌' },
      { name: 'Newspaper', type: 'recyclable', emoji: '📰' },
      { name: 'Apple Core', type: 'organic', emoji: '🍎' },
    ]
  },
  {
    level: 2,
    items: [
      { name: 'Aluminum Can', type: 'recyclable', emoji: '🥫' },
      { name: 'Food Scraps', type: 'organic', emoji: '🥗' },
      { name: 'Glass Jar', type: 'recyclable', emoji: '🫙' },
      { name: 'Battery', type: 'hazardous', emoji: '🔋' },
      { name: 'Cardboard Box', type: 'recyclable', emoji: '📦' },
    ]
  },
  {
    level: 3,
    items: [
      { name: 'Pizza Box', type: 'organic', emoji: '🍕' },
      { name: 'Metal Can', type: 'recyclable', emoji: '🥫' },
      { name: 'Light Bulb', type: 'hazardous', emoji: '💡' },
      { name: 'Coffee Grounds', type: 'organic', emoji: '☕' },
      { name: 'Paper Bag', type: 'recyclable', emoji: '🛍️' },
      { name: 'Plastic Bag', type: 'landfill', emoji: '🛍️' },
    ]
  },
  {
    level: 4,
    items: [
      { name: 'Wine Bottle', type: 'recyclable', emoji: '🍷' },
      { name: 'Paint Can', type: 'hazardous', emoji: '🎨' },
      { name: 'Eggshells', type: 'organic', emoji: '🥚' },
      { name: 'Styrofoam', type: 'landfill', emoji: '📦' },
      { name: 'Magazine', type: 'recyclable', emoji: '📔' },
      { name: 'Old Medicine', type: 'hazardous', emoji: '💊' },
      { name: 'Napkin', type: 'landfill', emoji: '🧻' },
    ]
  },
  {
    level: 5,
    items: [
      { name: 'Electronics', type: 'hazardous', emoji: '📱' },
      { name: 'Vegetable Peels', type: 'organic', emoji: '🥕' },
      { name: 'Aerosol Can', type: 'hazardous', emoji: '🧴' },
      { name: 'Milk Carton', type: 'recyclable', emoji: '🥛' },
      { name: 'Rubber Gloves', type: 'landfill', emoji: '🧤' },
      { name: 'Tea Bag', type: 'organic', emoji: '☕' },
      { name: 'Aluminum Foil', type: 'recyclable', emoji: '🌯' },
      { name: 'Diapers', type: 'landfill', emoji: '🍼' },
    ]
  }
];

const BINS = [
  { type: 'recyclable', name: 'Recyclable', color: '#10b981', emoji: '♻️' },
  { type: 'organic', name: 'Organic', color: '#84cc16', emoji: '🌱' },
  { type: 'hazardous', name: 'Hazardous', color: '#ef4444', emoji: '⚠️' },
  { type: 'landfill', name: 'Landfill', color: '#6b7280', emoji: '🗑️' },
];

const WasteSortingGame = ({ user }) => {
  const navigate = useNavigate();
  const [currentLevel, setCurrentLevel] = useState(0);
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [draggedItem, setDraggedItem] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    resetLevel();
  }, [currentLevel]);

  const resetLevel = () => {
    const levelData = LEVELS[currentLevel];
    setItems(levelData.items.map((item, index) => ({ ...item, id: index, sorted: false })));
    setScore(0);
    setFeedback(null);
    setCompleted(false);
  };

  const handleDragStart = (item) => {
    setDraggedItem(item);
  };

  const handleDrop = (binType) => {
    if (!draggedItem) return;

    const isCorrect = draggedItem.type === binType;
    const newScore = isCorrect ? score + 10 : Math.max(0, score - 5);
    setScore(newScore);

    setFeedback({
      correct: isCorrect,
      message: isCorrect ? '✓ Correct!' : '✗ Wrong bin!',
      item: draggedItem.name
    });

    setTimeout(() => setFeedback(null), 1500);

    if (isCorrect) {
      const newItems = items.map(item =>
        item.id === draggedItem.id ? { ...item, sorted: true } : item
      );
      setItems(newItems);

      if (newItems.every(item => item.sorted)) {
        completeLevel(newScore);
      }
    }

    setDraggedItem(null);
  };

  const completeLevel = async (finalScore) => {
    setCompleted(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/game-progress`,
        {
          game_type: 'waste_sorting',
          level: currentLevel + 1,
          score: finalScore,
          completed: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const nextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel(currentLevel + 1);
    } else {
      navigate('/dashboard');
    }
  };

  const levelData = LEVELS[currentLevel];
  const unsortedItems = items.filter(item => !item.sorted);

  return (
    <div className="game-page waste-sorting-game" data-testid="waste-sorting-game">
      <div className="game-header">
        <Link to="/dashboard" className="back-btn">
          <ArrowLeft size={20} />
          Back
        </Link>
        <div className="game-info">
          <span className="level-badge">Level {currentLevel + 1} / {LEVELS.length}</span>
          <span className="score-badge">Score: {score}</span>
        </div>
      </div>

      <div className="game-container">
        {!completed ? (
          <>
            <div className="game-instructions card">
              <h2>Sort the Waste!</h2>
              <p>Drag each item to the correct bin. Earn 10 points for correct sorts, lose 5 for mistakes.</p>
            </div>

            {feedback && (
              <div className={`feedback-banner ${feedback.correct ? 'correct' : 'incorrect'}`}>
                {feedback.message}
              </div>
            )}

            <div className="items-container">
              <h3>Items to Sort</h3>
              <div className="items-grid">
                {unsortedItems.map((item) => (
                  <div
                    key={item.id}
                    className="waste-item card-3d"
                    draggable
                    onDragStart={() => handleDragStart(item)}
                    data-testid={`waste-item-${item.id}`}
                  >
                    <div className="item-emoji">{item.emoji}</div>
                    <div className="item-name">{item.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bins-container">
              <h3>Bins</h3>
              <div className="bins-grid">
                {BINS.map((bin) => (
                  <div
                    key={bin.type}
                    className="waste-bin"
                    style={{ borderColor: bin.color }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(bin.type)}
                    data-testid={`bin-${bin.type}`}
                  >
                    <div className="bin-emoji" style={{ color: bin.color }}>
                      {bin.emoji}
                    </div>
                    <div className="bin-name" style={{ color: bin.color }}>
                      {bin.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="level-complete card">
            <div className="complete-icon">
              <Trophy size={64} />
            </div>
            <h1>Level {currentLevel + 1} Complete!</h1>
            <div className="final-score">
              <span className="score-label">Final Score:</span>
              <span className="score-value">{score}</span>
            </div>
            <div className="complete-actions">
              {currentLevel < LEVELS.length - 1 ? (
                <button onClick={nextLevel} className="btn btn-primary" data-testid="next-level-btn">
                  Next Level
                </button>
              ) : (
                <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                  Complete Game
                </button>
              )}
              <button onClick={resetLevel} className="btn btn-secondary">
                Retry Level
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WasteSortingGame;
