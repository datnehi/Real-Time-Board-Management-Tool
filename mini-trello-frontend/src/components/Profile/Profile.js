import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import DashboardLayout from '../Layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ email: '', name: '', description: '' });
  const [loading, setLoading] = useState(true);

  const userId = user?.email; 

  const fetchUser = async () => {
    try {
      const res = await api.get(`/users/${userId}`);
      setProfile(res.data);
    } catch (err) {
      alert('❌ Không thể lấy thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/users/${userId}`, {
        name: profile.name,
        description: profile.description
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

        <label>Tên:</label>
        <input
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          style={{ width: '100%', marginBottom: 8 }}
        />

        <label>Mô tả:</label>
        <textarea
          value={profile.description}
          onChange={(e) => setProfile({ ...profile, description: e.target.value })}
          style={{ width: '100%', marginBottom: 8 }}
        />

        <button onClick={handleUpdate}>💾 Cập nhật</button>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
