import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Lock, CheckCircle, Upload, Camera } from 'lucide-react';
import '../styles/ChallengesPage.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChallengesPage = ({ user }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/challenges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChallenges(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProof = async (challengeId) => {
    if (!imagePreview) {
      setMessage({ type: 'error', text: 'Please select an image first' });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/challenges/submit-proof`,
        {
          challenge_id: challengeId,
          image_data: imagePreview
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage({ type: 'success', text: 'Challenge completed! Points awarded!' });
      setSelectedChallenge(null);
      setImageFile(null);
      setImagePreview(null);
      fetchChallenges();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to submit proof' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading challenges...</div>;
  }

  return (
    <div className="challenges-page" data-testid="challenges-page">
      <div className="page-header">
        <Link to="/dashboard" className="back-btn">
          <ArrowLeft size={20} />
          Back
        </Link>
        <div className="header-content">
          <h1 className="page-title">Eco Challenges</h1>
          <p className="page-subtitle">Complete real-world environmental actions and earn rewards!</p>
        </div>
      </div>

      {message && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="close-btn">×</button>
        </div>
      )}

      <div className="challenges-container">
        <div className="challenges-grid">
          {challenges.map((challenge) => (
            <div 
              key={challenge.id} 
              className={`challenge-card card ${
                !challenge.unlocked ? 'locked' : 
                challenge.submitted ? 'completed' : ''
              }`}
              data-testid={`challenge-${challenge.id}`}
            >
              <div className="challenge-header">
                <div className="challenge-status">
                  {!challenge.unlocked && <Lock size={20} />}
                  {challenge.submitted && <CheckCircle size={20} />}
                </div>
                <div className="challenge-category">{challenge.category}</div>
              </div>
              
              <h3 className="challenge-title">{challenge.title}</h3>
              <p className="challenge-description">{challenge.description}</p>
              
              <div className="challenge-footer">
                <div className="challenge-points">
                  <span className="points-label">Reward:</span>
                  <span className="points-value">+{challenge.points_reward} pts</span>
                </div>
                
                {!challenge.unlocked && (
                  <div className="unlock-requirement">
                    Requires {challenge.points_required} points
                  </div>
                )}
                
                {challenge.unlocked && !challenge.submitted && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedChallenge(challenge)}
                    data-testid={`upload-proof-btn-${challenge.id}`}
                  >
                    <Upload size={16} />
                    Upload Proof
                  </button>
                )}
                
                {challenge.submitted && (
                  <span className="status-badge completed-badge">
                    {challenge.status === 'approved' ? '✓ Completed' : 'Under Review'}
                  </span>
                )}
              </div>
              
              {challenge.badge && (
                <div className="badge-reward">
                  Badge: {challenge.badge}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      {selectedChallenge && (
        <div className="modal-overlay" onClick={() => setSelectedChallenge(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setSelectedChallenge(null)}
            >
              ×
            </button>
            
            <h2 className="modal-title">{selectedChallenge.title}</h2>
            <p className="modal-description">{selectedChallenge.description}</p>
            
            <div className="upload-section">
              <label htmlFor="image-upload" className="upload-area">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <Camera size={48} />
                    <span>Click to upload image</span>
                  </div>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => handleSubmitProof(selectedChallenge.id)}
                disabled={!imagePreview || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Proof'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedChallenge(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengesPage;