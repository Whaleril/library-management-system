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
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, password }),
      });

      const response = await res.json();

      if (!res.ok) {
        throw new Error(response.message || 'Login failed');
      }

      // 后端返回格式: { code: 200, message: "登录成功", data: { token, userId, userName, role } }
      onLogin(response.data); // ✅ 传递 response.data
      navigate('/home');
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

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // 调用后端退出接口
        await fetch('http://localhost:3001/api/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 无论后端接口是否成功，都清除本地数据
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      onLogout();
      navigate('/login');
    }
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
    setUserInfo({ 
      userId: data.userId, 
      userName: data.userName, 
      role: data.role 
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ 
      userId: data.userId, 
      userName: data.userName, 
      role: data.role 
    }));
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
