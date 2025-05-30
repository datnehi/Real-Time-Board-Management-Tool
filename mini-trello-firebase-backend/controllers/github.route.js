const { db } = require('../firebase/firebase');
const axios = require('axios');

// Lấy branch, PR, commit, issue từ GitHub
exports.getRepoInfo = async (req, res) => {
  const { repositoryId } = req.params;

  try {
    const headers = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json'
    };

    const [branches, pulls, issues, commits] = await Promise.all([
      axios.get(`https://api.github.com/repos/${repositoryId}/branches`, { headers }),
      axios.get(`https://api.github.com/repos/${repositoryId}/pulls`, { headers }),
      axios.get(`https://api.github.com/repos/${repositoryId}/issues`, { headers }),
      axios.get(`https://api.github.com/repos/${repositoryId}/commits`, { headers })
    ]);

    res.status(200).json({
      repositoryId,
      branches: branches.data.map(b => ({ name: b.name, lastCommitSha: b.commit.sha })),
      pulls: pulls.data.map(p => ({ title: p.title, pullNumber: p.number })),
      issues: issues.data.map(i => ({ title: i.title, issueNumber: i.number })),
      commits: commits.data.slice(0, 10).map(c => ({ sha: c.sha, message: c.commit.message }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy thông tin GitHub', details: err.message });
  }
};

// Gắn GitHub item vào task
exports.attachGitHubItem = async (req, res) => {
  const { boardId, cardId, taskId } = req.params;
  const { type, number } = req.body;

  try {
    const newAttachment = {
      type,
      number,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').doc(taskId)
      .collection('github_attachments').add(newAttachment);

    res.status(201).json({ taskId, attachmentId: docRef.id, ...newAttachment });
  } catch (err) {
    res.status(500).json({ error: 'Không thể gắn GitHub item vào task' });
  }
};

// GET attachments
exports.getAttachments = async (req, res) => {
  const { boardId, cardId, taskId } = req.params;

  try {
    const snapshot = await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').doc(taskId)
      .collection('github_attachments').get();

    const attachments = snapshot.docs.map(doc => ({
      attachmentId: doc.id,
      ...doc.data()
    }));

    res.status(200).json(attachments);
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy danh sách GitHub attachments' });
  }
};

// DELETE attachment
exports.removeAttachment = async (req, res) => {
  const { boardId, cardId, taskId, attachmentId } = req.params;

  try {
    await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').doc(taskId)
      .collection('github_attachments').doc(attachmentId).delete();

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Không thể xoá GitHub attachment' });
  }
};
