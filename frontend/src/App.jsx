import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

function Login({ onLogin }) {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || 'Login failed');
      }

      const data = await res.json();
      onLogin(data); // 保存 token 和用户信息
      navigate('/home'); // 登录成功跳转首页
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

function Home({ userInfo, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  if (!userInfo) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="App">
      <h2>Welcome, {userInfo.userName}!</h2>
      <p>Role: {userInfo.role}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userInfo, setUserInfo] = useState(
    JSON.parse(localStorage.getItem('user')) || null
  );

  const handleLogin = (data) => {
    setToken(data.token);
    setUserInfo({ userId: data.userId, userName: data.userName, role: data.role });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ userId: data.userId, userName: data.userName, role: data.role }));
  };

  const handleLogout = () => {
    setToken('');
    setUserInfo(null);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={token && userInfo ? <Navigate to="/home" /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/home"
          element={<Home userInfo={userInfo} onLogout={handleLogout} />}
        />
        <Route
          path="*"
          element={<Navigate to={token && userInfo ? "/home" : "/login"} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
