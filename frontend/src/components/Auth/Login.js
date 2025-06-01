import React, { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();


    const handleLogin = async () => {
        try {
            const res = await api.post('/auth/signin', {
                email,
                verificationCode: code
            });

            const { accessToken } = res.data;
            login({ token: accessToken });
            alert('✅ Đăng nhập thành công!');
            navigate('/boardList');
        } catch (err) {
            alert('❌ Sai mã xác minh hoặc email');
        }
    };

    return (
        <div style={{
      maxWidth: 360,
      margin: '50px auto',
      padding: 24,
      backgroundColor: '#fff',
      borderRadius: 12,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>🔐 Đăng nhập</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: '100%',
          padding: 10,
          marginBottom: 16,
          borderRadius: 6,
          border: '1px solid #ccc',
          fontSize: 14
        }}
      />

      <input
        placeholder="Mã xác minh"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{
          width: '100%',
          padding: 10,
          marginBottom: 16,
          borderRadius: 6,
          border: '1px solid #ccc',
          fontSize: 14
        }}
      />

      <button
        onClick={handleLogin}
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 6,
          border: 'none',
          backgroundColor: '#007bff',
          color: '#fff',
          fontSize: 16,
          cursor: 'pointer',
          transition: 'background-color 0.3s ease'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
      >
        Đăng nhập
      </button>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
        Bạn chưa có tài khoản? <Link to="/signup" style={{ color: '#007bff' }}>Đăng ký</Link>
      </p>
    </div>
  );
};

export default Login;
