import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Leaf, Trophy, Target, LogOut, Bell, Award,
  Recycle, Zap, BookOpen, Users, User
} from 'lucide-react';
import '../styles/Dashboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, onLogout }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userStats, setUserStats] = useState(user);

  useEffect(() => {
    fetchNotifications();
    fetchUserData();
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

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
      const unread = response.data.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const progressToNextLevel = ((userStats.points % 100) / 100) * 100;
  const pointsToNextLevel = 100 - (userStats.points % 100);

  return (
    <div className="dashboard" data-testid="dashboard">
      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-content">
          <Link to="/dashboard" className="nav-logo">
            <Leaf size={32} className="logo-icon" />
            <span className="logo-text">EarthHeroes</span>
          </Link>
          
          <div className="nav-actions">
            <button 
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              data-testid="notifications-btn"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            
            <Link to="/profile" className="profile-btn">
              <User size={20} />
            </Link>
            
            <button onClick={onLogout} className="logout-btn" data-testid="logout-btn">
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
        
        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="notifications-dropdown" data-testid="notifications-dropdown">
            <div className="notifications-header">
              <h3>Notifications</h3>
            </div>
            <div className="notifications-list">
              {notifications.length === 0 ? (
                <p className="no-notifications">No notifications yet</p>
              ) : (
                notifications.slice(0, 5).map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div className="notification-icon">
                      {notif.type === 'achievement' && <Trophy size={18} />}
                      {notif.type === 'challenge_unlock' && <Target size={18} />}
                      {notif.type === 'reminder' && <Bell size={18} />}
                    </div>
                    <div className="notification-content">
                      <p>{notif.message}</p>
                      <span className="notification-time">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="dashboard-container">
        {/* User Stats Card */}
        <div className="stats-section">
          <div className="user-card card">
            <div className="user-header">
              <div className="user-avatar">
                {userStats.username.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <h2 className="user-name">{userStats.username}</h2>
                <p className="user-email">{userStats.email}</p>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-icon">
                  <Trophy size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{userStats.points}</div>
                  <div className="stat-label">Total Points</div>
                </div>
              </div>
              
              <div className="stat-box">
                <div className="stat-icon">
                  <Award size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">Level {userStats.level}</div>
                  <div className="stat-label">Current Level</div>
                </div>
              </div>
              
              <div className="stat-box">
                <div className="stat-icon">
                  <Target size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{userStats.badges.length}</div>
                  <div className="stat-label">Badges Earned</div>
                </div>
              </div>
            </div>
            
            <div className="level-progress">
              <div className="progress-header">
                <span>Progress to Level {userStats.level + 1}</span>
                <span className="progress-value">{pointsToNextLevel} points to go</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: `${progressToNextLevel}%`}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Games Section */}
        <div className="games-section">
          <h2 className="section-title">
            <BookOpen size={24} />
            Learning Games
          </h2>
          
          <div className="games-grid">
            <Link to="/quiz" className="game-tile card" data-testid="quiz-game-tile">
              <div className="game-tile-icon quiz-icon">
                <BookOpen size={36} />
              </div>
              <h3 className="game-tile-title">Environmental Quiz</h3>
              <p className="game-tile-description">
                Test your knowledge with challenging questions
              </p>
              <div className="game-tile-footer">
                <span className="game-badge">Multiple Topics</span>
              </div>
            </Link>
            
            <Link to="/waste-sorting" className="game-tile card" data-testid="waste-sorting-tile">
              <div className="game-tile-icon waste-icon">
                <Recycle size={36} />
              </div>
              <h3 className="game-tile-title">Waste Sorting</h3>
              <p className="game-tile-description">
                Master recycling by sorting items correctly
              </p>
              <div className="game-tile-footer">
                <span className="game-badge">5 Levels</span>
              </div>
            </Link>
            
            <Link to="/energy-saving" className="game-tile card" data-testid="energy-saving-tile">
              <div className="game-tile-icon energy-icon">
                <Zap size={36} />
              </div>
              <h3 className="game-tile-title">Energy Saving</h3>
              <p className="game-tile-description">
                Find and fix energy waste in virtual rooms
              </p>
              <div className="game-tile-footer">
                <span className="game-badge">5 Levels</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="actions-section">
          <h2 className="section-title">
            <Target size={24} />
            Quick Actions
          </h2>
          
          <div className="actions-grid">
            <Link to="/challenges" className="action-card card" data-testid="challenges-link">
              <Target size={32} />
              <h3>Eco Challenges</h3>
              <p>Complete real-world challenges and earn rewards</p>
            </Link>
            
            <Link to="/leaderboard" className="action-card card" data-testid="leaderboard-link">
              <Users size={32} />
              <h3>Leaderboard</h3>
              <p>See how you rank against other Earth Heroes</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;