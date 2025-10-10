import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Check, X } from 'lucide-react';
import '../styles/GamePages.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuizGame = ({ user }) => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/quiz/questions?limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, {
      question_id: questions[currentQuestion].id,
      selected_answer: selectedAnswer
    }];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/quiz/submit`,
        finalAnswers,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(response.data);
      
      // Save game progress
      await axios.post(
        `${API}/game-progress`,
        {
          game_type: 'quiz',
          level: 1,
          score: response.data.score,
          completed: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowResult(true);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResult(false);
    setResult(null);
    fetchQuestions();
  };

  if (loading) {
    return <div className="loading-screen">Loading quiz...</div>;
  }

  if (showResult && result) {
    return (
      <div className="game-page">
        <div className="game-container">
          <div className="result-card card">
            <div className={`result-icon ${result.score >= 80 ? 'success' : result.score >= 60 ? 'good' : 'try-again'}`}>
              {result.score >= 80 ? <Check size={64} /> : <X size={64} />}
            </div>
            <h1 className="result-title">
              {result.score >= 80 ? 'Excellent!' : result.score >= 60 ? 'Good Job!' : 'Keep Learning!'}
            </h1>
            <div className="result-score">
              <div className="score-circle">
                <span className="score-value">{result.score}%</span>
              </div>
            </div>
            <div className="result-details">
              <p>You answered <strong>{result.correct}</strong> out of <strong>{result.total}</strong> questions correctly</p>
              <p className="points-earned">You earned <strong>{result.score} points</strong>!</p>
            </div>
            <div className="result-actions">
              <button onClick={restartQuiz} className="btn btn-primary">
                Try Again
              </button>
              <Link to="/dashboard" className="btn btn-secondary">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="game-page" data-testid="quiz-game">
      <div className="game-header">
        <Link to="/dashboard" className="back-btn">
          <ArrowLeft size={20} />
          Back
        </Link>
        <div className="game-progress">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{width: `${progress}%`}}></div>
          </div>
        </div>
      </div>

      <div className="game-container">
        <div className="quiz-card card">
          <div className="quiz-header">
            <span className="question-number">Question {currentQuestion + 1}</span>
            <span className="category-badge">{question.category}</span>
          </div>
          
          <h2 className="question-text">{question.question}</h2>
          
          <div className="answers-grid">
            {question.options.map((option, index) => (
              <button
                key={index}
                className={`answer-option ${selectedAnswer === index ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(index)}
                data-testid={`answer-option-${index}`}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
          
          <button
            className={`btn btn-primary btn-full ${selectedAnswer === null ? 'btn-disabled' : ''}`}
            onClick={handleNext}
            disabled={selectedAnswer === null}
            data-testid="next-question-btn"
          >
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizGame;
