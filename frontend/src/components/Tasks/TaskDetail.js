import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const TaskDetail = () => {
  const { boardId, cardId, taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [taskMembers, setTaskMembers] = useState([]);
  const [boardMembers, setBoardMembers] = useState([]);
  const [showMemberModal, setShowMemberModal] = useState(false);


  useEffect(() => {
    const fetchTaskMembers = async () => {
      try {
        const res = await api.get(`/boards/${boardId}/cards/${cardId}/tasks/${taskId}/assign`);
        setTaskMembers(res.data);
      } catch (err) {
        console.error('Lỗi khi lấy thành viên của task:', err);
      }
    };

    const fetchBoardMembers = async () => {
      try {
        const res = await api.get(`/boards/${boardId}/members`);
        setBoardMembers(res.data);
      } catch (err) {
        console.error('Lỗi khi lấy thành viên của board:', err);
      }
    };

    fetchTask();
    fetchTaskMembers();
    fetchBoardMembers();
  }, [boardId, cardId, taskId]);

  const fetchTask = async () => {
    try {
      const res = await api.get(`/boards/${boardId}/cards/${cardId}/tasks/${taskId}`);
      setTask(res.data);
      setNewDescription(res.data.description || '');
      setNewStatus(res.data.status || '');
    } catch (err) {
      console.error('Lỗi khi lấy task:', err);
    }
  };

  const handleSave = async () => {
    try {
      await api.put(`/boards/${boardId}/cards/${cardId}/tasks/${taskId}`, {
        description: newDescription,
        status: newStatus
      });
      setTask(prev => ({ ...prev, description: newDescription }));
    } catch (err) {
      console.error('Lỗi khi cập nhật mô tả:', err);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await api.delete(`/boards/${boardId}/cards/${cardId}/tasks/${taskId}/assign/${memberId}`);
      setTaskMembers((prev) => prev.filter((m) => m.memberId !== memberId));
    } catch (err) {
      console.error('Lỗi khi xóa thành viên:', err);
    }
  };

  useEffect(() => {
    const fetchTaskMembers = async () => {
      try {
        const res = await api.get(`/boards/${boardId}/cards/${cardId}/tasks/${taskId}/assign`);
        setTaskMembers(res.data); 
      } catch (err) {
        console.error('Failed to fetch task members:', err);
      }
    };

    fetchTaskMembers();
  }, [boardId, cardId, taskId]);

  const handleAssignMember = async (memberId) => {
    try {
      await api.post(`/boards/${boardId}/cards/${cardId}/tasks/${taskId}/assign`, {
        memberId
      });
      setTaskMembers((prev) => [...prev, { taskId, memberId }]);
    } catch (err) {
      console.error('Failed to assign member:', err);
    }
  };


  if (!task) return <div>Đang tải...</div>;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>{task.title}</h2>
          <button onClick={() => navigate(-1)} style={styles.closeBtn}>✕</button>
        </div>

        <p style={styles.subtext}>in list <strong>To do</strong></p>

        <div style={styles.row}>
          <div style={styles.sectionLeft}>
            <div style={styles.section}>
              <h4 style={styles.label}>📝 Description</h4>
              <textarea
                rows={4}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                style={styles.textarea}
              />
              <h4 style={styles.label}>📝 Status</h4>
              <textarea
                rows={4}
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={styles.textarea}
              />
              <div style={{ marginTop: 8 }}>
                <button onClick={handleSave} style={styles.saveBtn}>Save</button>
              </div>
            </div>
          </div>

          <div style={styles.sectionRight}>
            <div>
              <p style={styles.label}>👥 Members</p>
              <div style={styles.memberList}>
                {taskMembers.map((member) => (
                  <div key={member.id} style={styles.avatar}>
                    {'?'}
                  </div>
                ))}
              </div>
              <button style={styles.rightBtn} onClick={() => setShowMemberModal(true)}>
                + Members
              </button>
            </div>

          </div>
        </div>
      </div>
      {showMemberModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Thêm thành viên vào task</h3>

            <ul style={styles.memberListModal}>
              {boardMembers.map((member) => {
                const isAssigned = taskMembers.some((m) => m.memberId === member.id);

                return (
                  <li key={member.id} style={styles.memberItem}>
                    <span>{member.email}</span>

                    {isAssigned ? (
                      <button
                        style={styles.removeBtn}
                        onClick={async () => {
                          await handleRemoveMember(member.id);
                        }}
                      >
                        X
                      </button>
                    ) : (
                      <button
                        style={styles.addBtn}
                        onClick={async () => {
                          await handleAssignMember(member.id);
                        }}
                      >
                        Thêm
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            <button style={styles.closeModalBtn} onClick={() => setShowMemberModal(false)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    backgroundColor: '#000000aa',
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modal: {
    backgroundColor: '#2c2f33',
    color: '#f0f0f0',
    padding: '24px',
    borderRadius: '12px',
    width: '80%',
    maxWidth: '900px',
    boxShadow: '0 0 16px rgba(0,0,0,0.4)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#fff',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#ccc',
    cursor: 'pointer',
  },
  subtext: {
    color: '#bbb',
    marginBottom: 16,
  },
  row: {
    display: 'flex',
    gap: '24px',
    marginTop: '24px',
  },
  sectionLeft: {
    flex: 3,
  },
  sectionRight: {
    flex: 1,
    borderLeft: '1px solid #444',
    paddingLeft: '16px',
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#ddd',
  },
  textarea: {
    width: '100%',
    borderRadius: '8px',
    border: '1px solid #666',
    backgroundColor: '#1e1f22',
    color: '#fff',
    padding: '10px',
    fontSize: '14px',
  },
  commentBox: {
    width: '100%',
    borderRadius: '8px',
    border: '1px solid #666',
    backgroundColor: '#1e1f22',
    color: '#fff',
    padding: '8px',
    fontSize: '14px',
  },
  text: {
    fontSize: '14px',
    color: '#ccc',
    marginBottom: 8,
  },
  saveBtn: {
    padding: '6px 12px',
    backgroundColor: '#61bd4f',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    marginRight: '8px',
  },
  cancelBtn: {
    padding: '6px 12px',
    backgroundColor: '#ccc',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  editBtn: {
    background: 'none',
    color: '#61bd4f',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  avatar: {
    backgroundColor: '#eb5a46',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    textAlign: 'center',
    lineHeight: '32px',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rightBtn: {
    backgroundColor: '#444',
    color: '#fff',
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #666',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'block',
    marginTop: '8px',
  },
  powerLinks: {
    color: '#aaa',
    fontSize: '13px',
    marginTop: '8px',
    lineHeight: '1.6',
  },
  memberList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '8px',
  },
  removeBtn: {
    marginLeft: '4px',
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#2c2f33',
    padding: '20px',
    borderRadius: '8px',
    width: '400px',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  memberListModal: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  memberItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  addBtn: {
    padding: '4px 8px',
    backgroundColor: '#61bd4f',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
  },
  closeModalBtn: {
    marginTop: '10px',
    padding: '6px 12px',
    backgroundColor: '#ccc',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },

};

export default TaskDetail;