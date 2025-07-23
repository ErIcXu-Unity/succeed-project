import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordInput from './PasswordInput.jsx';
import './Login.css'; // Reuse the same CSS

const Register = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    realName: '',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-generate email when student ID is entered
    if (name === 'studentId' && value.length === 7) {
      setFormData(prev => ({
        ...prev,
        email: `${value}@stu.com`
      }));
    }
  };

  const validateForm = () => {
    const { realName, studentId, email, password, confirmPassword } = formData;
    
    if (!realName.trim()) {
      setError('Real name is required');
      return false;
    }
    
    if (!/^\d{7}$/.test(studentId)) {
      setError('Student ID must be exactly 7 digits');
      return false;
    }
    
    if (email !== `${studentId}@stu.com`) {
      setError('Email format must be [studentId]@stu.com');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
                  const response = await fetch('http://localhost:5001/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          real_name: formData.realName,
          id_number: formData.studentId,
          username: formData.email,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Registration successful! Please login.');
        onBackToLogin();
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <header>
        <img src="/assets/logo.png" alt="UNSW Logo" />
        <h1>Escape Room Editor</h1>
      </header>

      <main>
        <div className="card-group">
          <div className="login-card" style={{ width: '600px' }}>
            <img src="/assets/graduation.png" alt="Student Registration" />
            <h2>Student Registration</h2>
            
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                name="realName"
                placeholder="Full Name"
                value={formData.realName}
                onChange={handleInputChange}
                required
                style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '5px' }}
              />
              
              <input
                type="text"
                name="studentId"
                placeholder="Student ID (7 digits)"
                value={formData.studentId}
                onChange={handleInputChange}
                maxLength="7"
                pattern="\d{7}"
                required
                style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '5px' }}
              />
              
              <input
                type="email"
                name="email"
                placeholder="Email (auto-generated)"
                value={formData.email}
                readOnly
                style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9' }}
              />
              
              <PasswordInput
                name="password"
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={handleInputChange}
                minLength="6"
                required
                style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '5px' }}
              />
              
              <PasswordInput
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                style={{ padding: '0.8rem', border: '1px solid #ccc', borderRadius: '5px' }}
              />
              
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  padding: '0.8rem', 
                  backgroundColor: '#231f20', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
              
              <button 
                type="button" 
                onClick={onBackToLogin}
                style={{ 
                  padding: '0.8rem', 
                  backgroundColor: 'transparent', 
                  color: '#231f20', 
                  border: '1px solid #231f20', 
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer>
        &copy; 2025 UNSW Sydney •{' '}
        <a href="https://moodle.telt.unsw.edu.au">Moodle Home</a>
      </footer>
    </div>
  );
};

export default Register; 