import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import DashboardLayout from '../Layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ email: '', verificationCode: ''});
  const [loading, setLoading] = useState(true);

  const userId = user?.token; 

  const fetchUser = async () => {
    try {
      const res = await api.get(`/auth/user`);
      setProfile(res.data);
    } catch (err) {
      alert('❌ Không thể lấy thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/auth/user/`, {
        verificationCode: profile.verificationCode
      });
      alert('✅ Cập nhật thành công!');
    } catch (err) {
      alert('❌ Cập nhật thất bại');
    }
  };

  useEffect(() => {
    if (userId) fetchUser();
  }, [userId]);

  if (loading) return <DashboardLayout>Đang tải...</DashboardLayout>;

  return (
    <DashboardLayout>
      <h2>👤 Thông tin cá nhân</h2>
      <div>
        <label>Email:</label>
        <input value={profile.email} readOnly style={{ width: '100%', marginBottom: 8 }} />

        <label>Mật khẩu:</label>
        <input
          value={profile.verificationCode}
          onChange={(e) => setProfile({ ...profile, verificationCode: e.target.value })}
          style={{ width: '100%', marginBottom: 8 }}
        />

        <button onClick={handleUpdate}>💾 Cập nhật</button>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
