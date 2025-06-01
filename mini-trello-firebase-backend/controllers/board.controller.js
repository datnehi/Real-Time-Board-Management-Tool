const { db, admin } = require('../firebase/firebase');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// POST /boards - tạo board mới
exports.createBoard = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Không có token' });
  }

  const token = authHeader.split(' ')[1]; 
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const ownerId = decoded.userId;

    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Tên board là bắt buộc' });
    }

    const boardId = uuidv4();
    const newBoard = {
      name,
      description: description || '',
      ownerId,
      members: [ownerId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('boards').doc(boardId).set(newBoard);

    res.status(201).json({ id: boardId, ...newBoard });
  } catch (err) {
    console.error('Lỗi xác thực hoặc tạo board:', err);
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
};

exports.getBoards = async (req, res) => {
  try {
    const userId = req.user?.id; 
    if (!userId) {
      return res.status(401).json({ error: 'User chưa xác thực' });
    }

    const ownerBoardsSnap = await db.collection('boards')
      .where('ownerId', '==', userId)
      .get();

    const memberBoardsSnap = await db.collection('boards')
      .where('members', 'array-contains', userId)
      .get();

    const boardsMap = new Map();

    ownerBoardsSnap.docs.forEach(doc => {
      boardsMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    memberBoardsSnap.docs.forEach(doc => {
      boardsMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    const boards = Array.from(boardsMap.values());

    res.status(200).json(boards);
  } catch (err) {
    console.error('getBoards error:', err);
    res.status(500).json({ error: 'Không thể lấy danh sách board' });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const { boardId } = req.params;

    const boardRef = db.collection('boards').doc(boardId);
    const boardSnap = await boardRef.get();

    if (!boardSnap.exists) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const boardData = boardSnap.data();
    const memberIds = boardData.members || [];
    const createdBy = boardData.createdBy;

    if (createdBy && !memberIds.includes(createdBy)) {
      memberIds.push(createdBy);
    }

    if (memberIds.length === 0) {
      return res.json([]); 
    }

    const userFetches = memberIds.map(uid =>
      db.collection('users').doc(uid).get()
    );
    const userSnaps = await Promise.all(userFetches);

    const members = userSnaps
      .filter(snap => snap.exists)
      .map(snap => ({
        id: snap.id,
        ...snap.data()
      }));

    res.json(members);
  } catch (err) {
    console.error('Lỗi khi lấy thành viên board:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBoardById = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Board id là bắt buộc' });

  try {
    const doc = await db.collection('boards').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Không tìm thấy bảng' });

    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('getBoardById error:', err);
    res.status(500).json({ error: 'Không thể lấy bảng' });
  }
};

exports.updateBoard = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!id) return res.status(400).json({ error: 'Board id là bắt buộc' });
  if (!name && !description) {
    return res.status(400).json({ error: 'Phải có ít nhất name hoặc description để cập nhật' });
  }

  try {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    updates.updatedAt = new Date().toISOString();

    await db.collection('boards').doc(id).update(updates);

    const io = req.app.get('io');
    if (io) {
      io.emit('board_updated', { boardId: id, updates });
    }

    res.status(200).json({ id, ...updates });
  } catch (err) {
    console.error('updateBoard error:', err);
    res.status(500).json({ error: 'Không thể cập nhật bảng' });
  }
};

exports.deleteBoard = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Board id là bắt buộc' });

  try {
    await db.collection('boards').doc(id).delete();

    const io = req.app.get('io');
    if (io) {
      io.emit('board_deleted', { boardId: id });
    }

    res.status(204).send();
  } catch (err) {
    console.error('deleteBoard error:', err);
    res.status(500).json({ error: 'Không thể xóa bảng' });
  }
};

exports.inviteToBoard = async (req, res) => {
  const { boardId } = req.params;
  const { invite_id, board_owner_id, member_id, email_member, status } = req.body;

  if (!boardId || !invite_id || !board_owner_id || !member_id) {
    return res.status(400).json({ error: 'Thiếu dữ liệu bắt buộc' });
  }

  try {
    const inviteData = {
      invite_id,
      board_owner_id,
      member_id,
      email_member: email_member || '',
      status: status || 'pending',
      createdAt: new Date().toISOString(),
    };

    await db.collection('boards').doc(boardId)
      .collection('invites')
      .doc(invite_id)
      .set(inviteData);

    const io = req.app.get('io');
    if (io) {
      io.to(boardId).emit('board_invited', {
        boardId,
        memberId: member_id,
        email: email_member,
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('inviteToBoard error:', err);
    res.status(500).json({ error: 'Không thể mời người vào bảng' });
  }
};

exports.acceptBoardInvite = async (req, res) => {
  const { boardId, id: cardId } = req.params;
  const { invite_id, member_id, status } = req.body;

  if (!boardId || !invite_id || !member_id || !status) {
    return res.status(400).json({ error: 'Thiếu dữ liệu bắt buộc' });
  }

  try {
    await db.collection('boards').doc(boardId)
      .collection('invites')
      .doc(invite_id)
      .update({ status });

    const boardRef = db.collection('boards').doc(boardId);
    await boardRef.update({
      members: admin.firestore.FieldValue.arrayUnion(member_id)
    });

    const io = req.app.get('io');
    if (io) {
      io.to(boardId).emit('member_joined', {
        boardId,
        memberId: member_id,
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('acceptBoardInvite error:', err);
    res.status(500).json({ error: 'Không thể chấp nhận lời mời' });
  }
};

exports.inviteMember = async (req, res) => {
  const { boardId } = req.params;
  const { board_owner_id, email_member } = req.body;

  try {
    const invite_id = uuidv4();
    const inviteData = {
      invite_id,
      board_id: boardId,
      board_owner_id,
      email_member: email_member || null,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await db.collection('invitations').doc(invite_id).set(inviteData);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Không thể gửi lời mời' });
  }
};

exports.respondToInvitation = async (req, res) => {
  const { boardId } = req.params;
  const { invite_id, status } = req.body;

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Không có token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const invitationRef = db.collection('invitations').doc(invite_id);

    const invitation = await invitationRef.get();
    if (!invitation.exists) {
      return res.status(404).json({ error: 'Không tìm thấy lời mời' });
    }

    await invitationRef.update({ status });

    if (status === 'accepted') {
      const cardRef = db.collection('boards').doc(boardId);
      await cardRef.update({
        members: admin.firestore.FieldValue.arrayUnion(userId)
      });
    }

    const io = req.app.get('io');
    io.to(boardId).emit('board_invite_response', {
      boardId,
      userId,
      status
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Không thể cập nhật lời mời' });
  }
};

exports.getInvitations = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Không có token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const snapshot = await db.collection('users').where('userId', '==', userId).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Không tìm thấy user' });
    }

    const userData = snapshot.docs[0].data();
    const userEmail = userData.email;

    const invitationsSnapshot = await db.collection('invitations')
      .where('email_member', '==', userEmail)
      .where('status', '==', 'pending')
      .get();

    const invitations = await Promise.all(
      invitationsSnapshot.docs.map(async (doc) => {
        const inviteData = doc.data();
        const boardId = inviteData.board_id;

        const boardDoc = await db.collection('boards').doc(boardId).get();
        const boardData = boardDoc.exists ? boardDoc.data() : { name: 'Không rõ' };

        return {
          ...inviteData,
          invite_id: doc.id,
          board_name: boardData.name || 'Không rõ',
        };
      })
    );

    res.status(200).json({ success: true, invitations });
  } catch (err) {
    console.error('Error getting invitations:', err);
    res.status(500).json({ error: 'Không thể lấy lời mời' });
  }
};

