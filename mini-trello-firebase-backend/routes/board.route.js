const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const boardController = require('../controllers/board.controller');

router.get('/invite', authMiddleware, boardController.getInvitations);

router.post('/', authMiddleware, boardController.createBoard);
router.get('/', authMiddleware, boardController.getBoards);
router.get('/:id', authMiddleware, boardController.getBoardById);
router.put('/:id', authMiddleware, boardController.updateBoard);
router.delete('/:id', authMiddleware, boardController.deleteBoard);

router.get('/:boardId/members', authMiddleware, boardController.getMembers);
router.post('/:boardId/invite', authMiddleware, boardController.inviteMember);
router.post('/:boardId/invite/accept', authMiddleware, boardController.respondToInvitation);

module.exports = router;
