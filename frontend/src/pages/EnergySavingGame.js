import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Trophy, Zap } from 'lucide-react';
import '../styles/GamePages.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LEVELS = [
  {
    level: 1,
    room: 'Living Room',
    devices: [
      { id: 1, name: 'TV', on: true, x: 20, y: 30, emoji: '📺', energy: 10 },
      { id: 2, name: 'Lamp', on: true, x: 70, y: 40, emoji: '💡', energy: 5 },
      { id: 3, name: 'Fan', on: false, x: 45, y: 20, emoji: '🌀', energy: 0 },
    ],
    target: 2
  },
  {
    level: 2,
    room: 'Kitchen',
    devices: [
      { id: 1, name: 'Fridge', on: true, x: 15, y: 35, emoji: '🧊', energy: 0 },
      { id: 2, name: 'Oven', on: true, x: 50, y: 30, emoji: '🔥', energy: 15 },
      { id: 3, name: 'Microwave', on: true, x: 80, y: 40, emoji: '📟', energy: 8 },
      { id: 4, name: 'Light', on: true, x: 35, y: 15, emoji: '💡', energy: 5 },
    ],
    target: 3
  },
  {
    level: 3,
    room: 'Bedroom',
    devices: [
      { id: 1, name: 'AC', on: true, x: 70, y: 25, emoji: '❄️', energy: 20 },
      { id: 2, name: 'Lamp', on: true, x: 25, y: 50, emoji: '🛋️', energy: 5 },
      { id: 3, name: 'Charger', on: true, x: 80, y: 60, emoji: '🔌', energy: 2 },
      { id: 4, name: 'Heater', on: false, x: 40, y: 30, emoji: '♨️', energy: 0 },
      { id: 5, name: 'Computer', on: true, x: 50, y: 70, emoji: '💻', energy: 12 },
    ],
    target: 3
  },
  {
    level: 4,
    room: 'Office',
    devices: [
      { id: 1, name: 'Desktop', on: true, x: 30, y: 50, emoji: '🖥️', energy: 15 },
      { id: 2, name: 'Printer', on: true, x: 65, y: 45, emoji: '🖨️', energy: 10 },
      { id: 3, name: 'Monitor', on: true, x: 45, y: 35, emoji: '🖥️', energy: 8 },
      { id: 4, name: 'Desk Lamp', on: true, x: 20, y: 30, emoji: '💡', energy: 5 },
      { id: 5, name: 'AC', on: true, x: 75, y: 20, emoji: '❄️', energy: 20 },
      { id: 6, name: 'Router', on: true, x: 55, y: 65, emoji: '📡', energy: 3 },
    ],
    target: 4
  },
  {
    level: 5,
    room: 'Entire House',
    devices: [
      { id: 1, name: 'Water Heater', on: true, x: 15, y: 25, emoji: '♨️', energy: 25 },
      { id: 2, name: 'Dishwasher', on: true, x: 30, y: 50, emoji: '🍽️', energy: 12 },
      { id: 3, name: 'Washing Machine', on: false, x: 45, y: 70, emoji: '🧺', energy: 0 },
      { id: 4, name: 'Dryer', on: true, x: 60, y: 45, emoji: '🌀', energy: 18 },
      { id: 5, name: 'TV', on: true, x: 75, y: 30, emoji: '📺', energy: 10 },
      { id: 6, name: 'Game Console', on: true, x: 85, y: 55, emoji: '🎮', energy: 8 },
      { id: 7, name: 'Pool Pump', on: true, x: 20, y: 80, emoji: '🏊', energy: 15 },
    ],
    target: 5
  }
];

const EnergySavingGame = ({ user }) => {
  const navigate = useNavigate();
  const [currentLevel, setCurrentLevel] = useState(0);
  const [devices, setDevices] = useState([]);
  const [turnedOff, setTurnedOff] = useState(0);
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    resetLevel();
  }, [currentLevel]);

  useEffect(() => {
    if (completed || timeLeft === 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          completeLevel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [completed, timeLeft]);

  const resetLevel = () => {
    const levelData = LEVELS[currentLevel];
    setDevices(levelData.devices);
    setTurnedOff(0);
    setTotalEnergy(0);
    setCompleted(false);
    setTimeLeft(60);
  };

  const toggleDevice = (deviceId) => {
    if (completed) return;

    const device = devices.find(d => d.id === deviceId);
    if (!device || !device.on) return;

    const newDevices = devices.map(d =>
      d.id === deviceId ? { ...d, on: false } : d
    );
    setDevices(newDevices);

    const newTurnedOff = turnedOff + 1;
    setTurnedOff(newTurnedOff);
    setTotalEnergy(totalEnergy + device.energy);

    if (newTurnedOff >= LEVELS[currentLevel].target) {
      completeLevel(totalEnergy + device.energy);
    }
  };

  const completeLevel = async (energySaved = totalEnergy) => {
    setCompleted(true);
    const score = energySaved + Math.floor(timeLeft / 2);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/game-progress`,
        {
          game_type: 'energy_saving',
          level: currentLevel + 1,
          score: score,
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
  const score = totalEnergy + Math.floor(timeLeft / 2);

  return (
    <div className="game-page energy-saving-game" data-testid="energy-saving-game">
      <div className="game-header">
        <Link to="/dashboard" className="back-btn">
          <ArrowLeft size={20} />
          Back
        </Link>
        <div className="game-info">
          <span className="level-badge">Level {currentLevel + 1} / {LEVELS.length}</span>
          <span className="time-badge">Time: {timeLeft}s</span>
          <span className="energy-badge">
            <Zap size={16} />
            Energy Saved: {totalEnergy}
          </span>
        </div>
      </div>

      <div className="game-container">
        {!completed ? (
          <>
            <div className="game-instructions card">
              <h2>{levelData.room}</h2>
              <p>
                Turn off at least <strong>{levelData.target}</strong> unnecessary devices to save energy!
                Click on devices that are wasting power.
              </p>
              <div className="progress-info">
                <span>Turned Off: {turnedOff} / {levelData.target}</span>
              </div>
            </div>

            <div className="room-container card">
              <div className="room-space">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className={`device ${device.on ? 'device-on' : 'device-off'}`}
                    style={{
                      left: `${device.x}%`,
                      top: `${device.y}%`
                    }}
                    onClick={() => toggleDevice(device.id)}
                    data-testid={`device-${device.id}`}
                  >
                    <div className="device-emoji">{device.emoji}</div>
                    <div className="device-name">{device.name}</div>
                    {device.on && (
                      <div className="device-status">
                        <div className="status-indicator"></div>
                        <span>{device.energy}W</span>
                      </div>
                    )}
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
            <div className="energy-stats">
              <div className="stat-item">
                <Zap size={32} />
                <span className="stat-label">Energy Saved</span>
                <span className="stat-value">{totalEnergy}W</span>
              </div>
              <div className="stat-item">
                <Trophy size={32} />
                <span className="stat-label">Total Score</span>
                <span className="stat-value">{score}</span>
              </div>
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

export default EnergySavingGame;
