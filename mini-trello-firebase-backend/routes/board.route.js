const express = require('express');
const router = express.Router();
const boardController = require('../controllers/board.controller');

// CRUD board
router.post('/', boardController.createBoard);
router.get('/', boardController.getBoardsByUser);
router.get('/:id', boardController.getBoardById);
router.put('/:id', boardController.updateBoard);
router.delete('/:id', boardController.deleteBoard);

// Invite
router.post('/:boardId/invite', boardController.inviteToBoard);
router.post('/:boardId/cards/:id/invite/accept', boardController.acceptBoardInvite);

module.exports = router;
