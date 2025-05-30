const express = require('express');
const router = express.Router();
const githubController = require('../controllers/github.controller');

router.get('/repositories/:repositoryId/github-info', githubController.getRepoInfo);
router.post('/boards/:boardId/cards/:cardId/tasks/:taskId/github-attach', githubController.attachGitHubItem);
router.get('/boards/:boardId/cards/:cardId/tasks/:taskId/github-attachments', githubController.getAttachments);
router.delete('/boards/:boardId/cards/:cardId/tasks/:taskId/github-attachments/:attachmentId', githubController.removeAttachment);

module.exports = router;
