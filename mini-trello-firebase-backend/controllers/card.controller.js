const { db } = require('../firebase/firebase');
const { v4: uuidv4 } = require('uuid');

exports.getAllCards = async (req, res) => {
  const { boardId } = req.params;

  try {
    const cardsSnap = await db.collection('boards').doc(boardId)
      .collection('cards').get();

    const cardsWithTasks = await Promise.all(
      cardsSnap.docs.map(async (cardDoc) => {
        const cardData = cardDoc.data();
        const cardId = cardDoc.id;

        const tasksSnap = await db.collection('boards').doc(boardId)
          .collection('cards').doc(cardId)
          .collection('tasks').get();

        const tasks = tasksSnap.docs.map(taskDoc => ({
          id: taskDoc.id,
          ...taskDoc.data()
        }));

        return {
          id: cardId,
          ...cardData,
          tasks
        };
      })
    );

    res.status(200).json(cardsWithTasks);
  } catch (err) {
    res.status(500).json({ error: 'Không thể tải danh sách cards và tasks' });
  }
};

exports.createCard = async (req, res) => {
  const { boardId } = req.params;
  const { name, description } = req.body;

  try {
    const newCard = {
      name,
      description,
      members: [],
      tasks_count: 0,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('boards').doc(boardId).collection('cards').add(newCard);

    const io = req.app.get('io');
    io.to(boardId).emit('card_created', {
      boardId,
      card: {
        id: docRef.id,
        ...newCard
      }
    });
    
    res.status(201).json({
      id: docRef.id,
      name: newCard.name,
      description: newCard.description
    });
  } catch (err) {
    res.status(500).json({ error: 'Không thể tạo thẻ' });
  }
};

exports.getCardById = async (req, res) => {
  const { boardId, id } = req.params;
  try {
    const doc = await db.collection('boards').doc(boardId).collection('cards').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Không tìm thấy thẻ' });

    const data = doc.data();
    res.status(200).json({
      id: doc.id,
      name: data.name,
      description: data.description
    });
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy thẻ' });
  }
};

exports.updateCard = async (req, res) => {
  const { boardId, id } = req.params;
  const { name, description, ...params } = req.body;

  try {
    const updatedCard = {
      name,
      description,
      ...params
    };

    await db.collection('boards').doc(boardId).collection('cards').doc(id).update(updatedCard);

    const io = req.app.get('io');
    io.to(boardId).emit('card_updated', {
      boardId,
      cardId: id,
      updates: updatedCard
    });

    res.status(200).json({ id, ...updatedCard });
  } catch (err) {
    res.status(500).json({ error: 'Không thể cập nhật thẻ' });
  }
};

exports.deleteCard = async (req, res) => {
  const { boardId, id } = req.params;

  try {
    await db.collection('boards').doc(boardId).collection('cards').doc(id).delete();

    const io = req.app.get('io');
    io.to(boardId).emit('card_deleted', {
      boardId,
      cardId: id
    });

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Không thể xóa thẻ' });
  }
};

exports.getCardsByUser = async (req, res) => {
  const { boardId, user_id } = req.params;
  try {
    const snapshot = await db.collection('boards').doc(boardId).collection('cards')
      .where('members', 'array-contains', user_id).get();

    const cards = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        tasks_count: data.tasks_count,
        members: data.members,
        createdAt: data.createdAt
      };
    });

    res.status(200).json(cards);
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy thẻ theo người dùng' });
  }
};
