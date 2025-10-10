import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import QuizGame from './pages/QuizGame';
import WasteSortingGame from './pages/WasteSortingGame';
import EnergySavingGame from './pages/EnergySavingGame';
import ChallengesPage from './pages/ChallengesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('token', response.data.access_token);
    setUser(response.data.user);
    return response.data;
  };

  const register = async (username, email, password) => {
    const response = await axios.post(`${API}/auth/register`, { username, email, password });
    localStorage.setItem('token', response.data.access_token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage onLogin={login} />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage onRegister={register} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={logout} /> : <Navigate to="/login" />} />
        <Route path="/quiz" element={user ? <QuizGame user={user} /> : <Navigate to="/login" />} />
        <Route path="/waste-sorting" element={user ? <WasteSortingGame user={user} /> : <Navigate to="/login" />} />
        <Route path="/energy-saving" element={user ? <EnergySavingGame user={user} /> : <Navigate to="/login" />} />
        <Route path="/challenges" element={user ? <ChallengesPage user={user} /> : <Navigate to="/login" />} />
        <Route path="/leaderboard" element={user ? <LeaderboardPage user={user} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <ProfilePage user={user} onLogout={logout} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;