import { Link } from 'react-router-dom';
import { Leaf, Trophy, Users, Target } from 'lucide-react';
import '../styles/LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <Leaf size={32} className="logo-icon" />
            <span className="logo-text">EarthHeroes</span>
          </div>
          <div className="nav-links">
            <Link to="/login" className="btn btn-secondary">Login</Link>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content fade-in">
            <h1 className="hero-title">
              Learn, Play, and Save the Planet
            </h1>
            <p className="hero-subtitle">
              Join thousands of students making a real difference through gamified environmental education. Earn points, unlock challenges, and become an Earth Hero!
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary btn-large" data-testid="get-started-btn">
                Start Your Journey
              </Link>
              <Link to="/login" className="btn btn-secondary btn-large">
                Sign In
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">50K+</div>
                <div className="stat-label">Active Students</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">1M+</div>
                <div className="stat-label">Challenges Completed</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">500K+</div>
                <div className="stat-label">Trees Planted</div>
              </div>
            </div>
          </div>
          <div className="hero-image fade-in">
            <img 
              src="https://images.unsplash.com/photo-1581578017306-7334b15283df" 
              alt="Environmental education" 
              className="hero-img"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-title">Why Choose EarthHeroes?</h2>
          <div className="features-grid">
            <div className="feature-card card fade-in">
              <div className="feature-icon">
                <Trophy size={48} />
              </div>
              <h3 className="feature-title">Gamified Learning</h3>
              <p className="feature-description">
                Earn points, badges, and climb the leaderboard as you master environmental concepts through interactive games.
              </p>
            </div>
            <div className="feature-card card fade-in">
              <div className="feature-icon">
                <Target size={48} />
              </div>
              <h3 className="feature-title">Real-World Challenges</h3>
              <p className="feature-description">
                Complete eco-challenges in your daily life and upload proof to earn rewards and make a real impact.
              </p>
            </div>
            <div className="feature-card card fade-in">
              <div className="feature-icon">
                <Users size={48} />
              </div>
              <h3 className="feature-title">Community Driven</h3>
              <p className="feature-description">
                Join a global community of environmental champions and compete with students worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="games-section">
        <div className="section-container">
          <h2 className="section-title">Interactive Learning Games</h2>
          <div className="games-grid">
            <div className="game-card card-3d card">
              <img 
                src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09" 
                alt="Waste sorting" 
                className="game-image"
              />
              <div className="game-content">
                <h3 className="game-title">Waste Sorting Challenge</h3>
                <p className="game-description">
                  Master the art of recycling by sorting waste into the correct bins. 5 levels of increasing difficulty!
                </p>
                <div className="game-badge">5 Levels</div>
              </div>
            </div>
            <div className="game-card card-3d card">
              <img 
                src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86" 
                alt="Energy saving" 
                className="game-image"
              />
              <div className="game-content">
                <h3 className="game-title">Energy Saving Puzzle</h3>
                <p className="game-description">
                  Find and turn off energy-wasting devices in virtual rooms. Learn conservation in action!
                </p>
                <div className="game-badge">5 Levels</div>
              </div>
            </div>
            <div className="game-card card-3d card">
              <img 
                src="https://images.unsplash.com/photo-1654626565292-10f85a1fad76" 
                alt="Quiz game" 
                className="game-image"
              />
              <div className="game-content">
                <h3 className="game-title">Environmental Quiz</h3>
                <p className="game-description">
                  Test your knowledge with challenging questions about climate, pollution, and sustainability.
                </p>
                <div className="game-badge">Multiple Categories</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Become an Earth Hero?</h2>
            <p className="cta-subtitle">
              Join our community today and start making a difference while having fun!
            </p>
            <Link to="/register" className="btn btn-primary btn-large">
              Create Free Account
            </Link>
          </div>
          <div className="cta-image">
            <img 
              src="https://images.unsplash.com/photo-1594058573823-d8edf1ad3380" 
              alt="Sustainable living" 
              className="cta-img"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-logo">
            <Leaf size={28} className="logo-icon" />
            <span className="logo-text">EarthHeroes</span>
          </div>
          <p className="footer-text">
            Empowering students to create a sustainable future through education and action.
          </p>
          <p className="footer-copyright">
            © 2024 EarthHeroes. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;