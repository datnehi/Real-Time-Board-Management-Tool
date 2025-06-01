import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box,
  IconButton, Badge, Menu, MenuItem, ListItemText
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../services/api';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const res = await api.get('/boards/invite');
      setInvitations(res.data.invitations || []);
    } catch (err) {
      console.error("Fetch invites failed", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleAccept = async (inviteId, boardId) => {
    try {
      await api.post(`/boards/${boardId}/invite/accept`, {
        invite_id: inviteId,
        status: 'accepted'
      });

      setInvitations(prev => prev.filter(i => i.invite_id !== inviteId));
      fetchInvites();
    } catch (error) {
      console.error("Accept invite error", error);
    }
  };

  const handleDecline = async (inviteId, boardId) => {
    try {
      await api.post(`/boards/${boardId}/invite/accept`, {
        invite_id: inviteId,
        status: 'declined'
      });

      setInvitations(prev => prev.filter(i => i.invite_id !== inviteId));
    } catch (error) {
      console.error("Decline invite error", error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            🧩 Mini Trello App
          </Typography>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton color="inherit" onClick={handleOpenMenu}>
                <Badge badgeContent={invitations.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
              >
                {Array.isArray(invitations) && invitations.length === 0 ? (
                  <MenuItem disabled>Không có lời mời</MenuItem>
                ) : (
                  invitations.map(invite => (
                    <MenuItem key={invite.invite_id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <ListItemText
                        primary={`Mời vào bảng: ${invite.board_name}`}
                        secondary={`Trạng thái: ${invite.status}`}
                      />
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" onClick={() => handleAccept(invite.invite_id, invite.board_id)}>
                          Chấp nhận
                        </Button>
                        <Button size="small" color="error" variant="outlined" onClick={() => handleDecline(invite.invite_id, invite.board_id)}>
                          Từ chối
                        </Button>
                      </Box>
                    </MenuItem>
                  ))
                )}

              </Menu>

              <Button color="inherit" component={Link} to="/boardList">Boards</Button>
              <Button color="inherit" component={Link} to="/profile">Profile</Button>
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </Box>
          )}

          {!user && (
            <Box>
              <Button color="inherit" component={Link} to="/login">Login</Button>
              <Button color="inherit" component={Link} to="/signup">Signup</Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ padding: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
