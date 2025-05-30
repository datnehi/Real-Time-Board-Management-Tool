const { db, admin } = require('../firebase/firebase');

// POST /boards
exports.createBoard = async (req, res) => {
  const { name, description, ownerId } = req.body;

  try {
    const newBoard = {
      name,
      description,
      ownerId,
      members: [ownerId],
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('boards').add(newBoard);

    // 🔴 Emit socket
    const io = req.app.get('io');
    io.emit('board_created', {
      boardId: docRef.id,
      board: newBoard
    });

    res.status(201).json({ id: docRef.id, ...newBoard });
  } catch (err) {
    res.status(500).json({ error: 'Không thể tạo board' });
  }
};

// GET /boards?userId=abc
exports.getBoardsByUser = async (req, res) => {
  const { userId } = req.query;

  try {
    const snapshot = await db.collection('boards')
      .where('members', 'array-contains', userId)
      .get();

    const boards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(boards);
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy danh sách bảng' });
  }
};

// GET /boards/:id
exports.getBoardById = async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection('boards').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Không tìm thấy bảng' });

    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy bảng' });
  }
};

// PUT /boards/:id
exports.updateBoard = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const updates = {
      name,
      description,
      updatedAt: new Date().toISOString()
    };

    await db.collection('boards').doc(id).update(updates);

    // 🔴 Emit socket
    const io = req.app.get('io');
    io.emit('board_updated', {
      boardId: id,
      updates
    });

    res.status(200).json({ id, ...updates });
  } catch (err) {
    res.status(500).json({ error: 'Không thể cập nhật bảng' });
  }
};

// DELETE /boards/:id
exports.deleteBoard = async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection('boards').doc(id).delete();

    // 🔴 Emit socket
    const io = req.app.get('io');
    io.emit('board_deleted', { boardId: id });

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Không thể xóa bảng' });
  }
};

// POST /boards/:boardId/invite
exports.inviteToBoard = async (req, res) => {
  const { boardId } = req.params;
  const { invite_id, board_owner_id, member_id, email_member, status } = req.body;

  try {
    const inviteData = {
      invite_id,
      board_owner_id,
      member_id,
      email_member: email_member || '',
      status: status || 'pending',
      createdAt: new Date().toISOString()
    };

    await db.collection('boards').doc(boardId)
      .collection('invites')
      .doc(invite_id)
      .set(inviteData);

    // 🔴 Emit socket
    const io = req.app.get('io');
    io.to(boardId).emit('board_invited', {
      boardId,
      memberId: member_id,
      email: email_member
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Không thể mời người vào bảng' });
  }
};

// POST /boards/:boardId/cards/:id/invite/accept
exports.acceptBoardInvite = async (req, res) => {
  const { boardId, id: cardId } = req.params;
  const { invite_id, member_id, status } = req.body;

  try {
    // Cập nhật trạng thái lời mời
    await db.collection('boards').doc(boardId)
      .collection('invites')
      .doc(invite_id)
      .update({ status });

    // Thêm member vào bảng
    const boardRef = db.collection('boards').doc(boardId);
    await boardRef.update({
      members: admin.firestore.FieldValue.arrayUnion(member_id)
    });

    // 🔴 Emit socket
    const io = req.app.get('io');
    io.to(boardId).emit('member_joined', {
      boardId,
      memberId: member_id
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Không thể chấp nhận lời mời' });
  }
};
