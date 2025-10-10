import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Trophy, Medal, Award } from 'lucide-react';
import '../styles/LeaderboardPage.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeaderboardPage = ({ user }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/leaderboard?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaderboard(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={24} className="rank-icon gold" />;
    if (rank === 2) return <Medal size={24} className="rank-icon silver" />;
    if (rank === 3) return <Medal size={24} className="rank-icon bronze" />;
    return <span className="rank-number">{rank}</span>;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return '';
  };

  if (loading) {
    return <div className="loading-screen">Loading leaderboard...</div>;
  }

  return (
    <div className="leaderboard-page" data-testid="leaderboard-page">
      <div className="page-header">
        <Link to="/dashboard" className="back-btn">
          <ArrowLeft size={20} />
          Back
        </Link>
        <div className="header-content">
          <Trophy size={48} className="header-icon" />
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-subtitle">Top Environmental Champions</p>
        </div>
      </div>

      <div className="leaderboard-container">
        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="podium">
            <div className="podium-item podium-2">
              <div className="podium-rank">
                <Medal size={32} className="rank-icon silver" />
              </div>
              <div className="podium-avatar">2</div>
              <h3 className="podium-name">{leaderboard[1].username}</h3>
              <div className="podium-points">{leaderboard[1].points} pts</div>
              <div className="podium-level">Level {leaderboard[1].level}</div>
            </div>
            
            <div className="podium-item podium-1">
              <div className="podium-rank">
                <Trophy size={40} className="rank-icon gold" />
              </div>
              <div className="podium-avatar champion">1</div>
              <h3 className="podium-name">{leaderboard[0].username}</h3>
              <div className="podium-points">{leaderboard[0].points} pts</div>
              <div className="podium-level">Level {leaderboard[0].level}</div>
            </div>
            
            <div className="podium-item podium-3">
              <div className="podium-rank">
                <Medal size={28} className="rank-icon bronze" />
              </div>
              <div className="podium-avatar">3</div>
              <h3 className="podium-name">{leaderboard[2].username}</h3>
              <div className="podium-points">{leaderboard[2].points} pts</div>
              <div className="podium-level">Level {leaderboard[2].level}</div>
            </div>
          </div>
        )}

        {/* Rest of Leaderboard */}
        <div className="leaderboard-list card">
          {leaderboard.map((entry) => (
            <div 
              key={entry.rank} 
              className={`leaderboard-row ${getRankClass(entry.rank)} ${
                entry.username === user.username ? 'current-user' : ''
              }`}
              data-testid={`leaderboard-entry-${entry.rank}`}
            >
              <div className="row-rank">
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="row-avatar">
                {entry.username.charAt(0).toUpperCase()}
              </div>
              
              <div className="row-info">
                <h3 className="row-name">
                  {entry.username}
                  {entry.username === user.username && (
                    <span className="you-badge">You</span>
                  )}
                </h3>
                <span className="row-level">Level {entry.level}</span>
              </div>
              
              <div className="row-points">
                <Award size={18} />
                <span>{entry.points} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;