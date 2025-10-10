import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Trophy, Award, Target, LogOut } from 'lucide-react';
import '../styles/ProfilePage.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfilePage = ({ user, onLogout }) => {
  const [userStats, setUserStats] = useState(user);
  const [gameProgress, setGameProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchGameProgress();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserStats(response.data);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchGameProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/game-progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGameProgress(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch game progress:', error);
      setLoading(false);
    }
  };

  const getBadgeEmoji = (badge) => {
    const badgeMap = {
      'Quiz Master': '📚',
      'Sorting Champion': '♻️',
      'Energy Hero': '⚡',
      'Plastic Warrior': '🛡️',
      'Green Thumb': '🌱',
      'Energy Detective': '🔍',
      'Eco Commuter': '🚲',
      'Waste Warrior': '🗑️',
      'Cleanup Champion': '🧹'
    };
    return badgeMap[badge] || '🏆';
  };

  const totalGamesPlayed = gameProgress.length;
  const totalScore = gameProgress.reduce((sum, game) => sum + game.score, 0);
  const completedGames = gameProgress.filter(game => game.completed).length;

  if (loading) {
    return <div className="loading-screen">Loading profile...</div>;
  }

  return (
    <div className="profile-page" data-testid="profile-page">
      <div className="page-header">
        <Link to="/dashboard" className="back-btn">
          <ArrowLeft size={20} />
          Back
        </Link>
        <button onClick={onLogout} className="logout-btn">
          <LogOut size={20} />
          Logout
        </button>
      </div>

      <div className="profile-container">
        {/* User Header Card */}
        <div className="profile-header card">
          <div className="profile-avatar-large">
            {userStats.username.charAt(0).toUpperCase()}
          </div>
          <h1 className="profile-name">{userStats.username}</h1>
          <p className="profile-email">{userStats.email}</p>
          <div className="profile-level">
            <Award size={24} />
            <span>Level {userStats.level}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card card">
            <Trophy size={32} className="stat-icon" />
            <div className="stat-value">{userStats.points}</div>
            <div className="stat-label">Total Points</div>
          </div>
          
          <div className="stat-card card">
            <Target size={32} className="stat-icon" />
            <div className="stat-value">{userStats.badges.length}</div>
            <div className="stat-label">Badges Earned</div>
          </div>
          
          <div className="stat-card card">
            <Award size={32} className="stat-icon" />
            <div className="stat-value">{completedGames}</div>
            <div className="stat-label">Games Completed</div>
          </div>
          
          <div className="stat-card card">
            <Trophy size={32} className="stat-icon" />
            <div className="stat-value">{totalScore}</div>
            <div className="stat-label">Total Score</div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="section card">
          <h2 className="section-title">
            <Award size={24} />
            Achievements & Badges
          </h2>
          {userStats.badges.length > 0 ? (
            <div className="badges-grid">
              {userStats.badges.map((badge, index) => (
                <div key={index} className="badge-item" data-testid={`badge-${index}`}>
                  <div className="badge-emoji">{getBadgeEmoji(badge)}</div>
                  <div className="badge-name">{badge}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No badges earned yet. Complete games and challenges to earn badges!</p>
          )}
        </div>

        {/* Game Progress Section */}
        <div className="section card">
          <h2 className="section-title">
            <Target size={24} />
            Game Progress
          </h2>
          {gameProgress.length > 0 ? (
            <div className="progress-list">
              {gameProgress.slice(0, 10).map((game, index) => (
                <div key={index} className="progress-item" data-testid={`progress-${index}`}>
                  <div className="progress-info">
                    <span className="progress-game">
                      {game.game_type === 'quiz' && '📚 Quiz Game'}
                      {game.game_type === 'waste_sorting' && '♻️ Waste Sorting'}
                      {game.game_type === 'energy_saving' && '⚡ Energy Saving'}
                    </span>
                    <span className="progress-level">Level {game.level}</span>
                  </div>
                  <div className="progress-score">
                    <span className="score-points">{game.score} pts</span>
                    {game.completed && <span className="completed-badge">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No game progress yet. Start playing games to track your progress!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;