const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/auth');
const cardController = require('../controllers/card.controller');

router.get('/', authMiddleware, cardController.getAllCards);

router.post('/', authMiddleware, cardController.createCard);

router.get('/:id', authMiddleware, cardController.getCardById);

router.put('/:id', authMiddleware, cardController.updateCard);

router.delete('/:id', authMiddleware, cardController.deleteCard);

router.get('/user/:user_id', authMiddleware, cardController.getCardsByUser);

module.exports = router;
