const { db } = require('../firebase/firebase');
const { Octokit } = require("@octokit/rest");
const jwt = require('jsonwebtoken');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

exports.getTasks = async (req, res) => {
  const { boardId, id: cardId } = req.params; 
  try {
    const snapshot = await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').get();

    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy danh sách task' });
  }
};

exports.createTask = async (req, res) => {
  const { boardId, cardId } = req.params;
  const { title, description, status } = req.body;
  const authHeader = req.headers.authorization;

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const ownerId = decoded.userId;
    const newTask = {
      cardId,
      title,
      description,
      status,
      ownerId,
      members: [ownerId],
      createdAt: new Date().toISOString()
    };

    const taskRef = await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').add(newTask);

    const io = req.app.get('io');
    io.to(boardId).emit('task_created', {
      boardId,
      cardId,
      taskId: taskRef.id,
      task: newTask
    });

    res.status(201).json({ id: taskRef.id, cardId, ownerId, ...newTask });
  } catch (err) {
    res.status(500).json({ error: 'Không thể tạo task' });
  }
};

exports.getTaskById = async (req, res) => {
  const { boardId, cardId, taskId } = req.params;
  try {
    const taskDoc = await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Không tìm thấy task' });
    }

    res.status(200).json({ id: taskDoc.id, cardId, ...taskDoc.data() });
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy task' });
  }
};

exports.updateTask = async (req, res) => {
  const { boardId, cardId, taskId } = req.params;
  const updates = req.body;

  try {
    const updatedTask = {
      ...updates,
    };

    const taskRef = db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').doc(taskId);

    const taskSnap = await taskRef.get();
    if (!taskSnap.exists) {
      return res.status(404).json({ error: 'Task không tồn tại' });
    }

    await taskRef.update(updatedTask);

    const io = req.app.get('io');
    io.to(boardId).emit('task_updated', {
      boardId,
      cardId,
      taskId,
      updates: updatedTask
    });

    res.status(200).json({ id: taskId, cardId, ...updatedTask });
  } catch (err) {
    res.status(500).json({ error: 'Không thể cập nhật task' });
  }
};

exports.deleteTask = async (req, res) => {
  const { boardId, cardId, taskId } = req.params;

  try {
    await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').doc(taskId).delete();

    const io = req.app.get('io');
    io.to(boardId).emit('task_deleted', {
      boardId,
      cardId,
      taskId
    });

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Không thể xóa task' });
  }
};

exports.assignMemberToTask = async (req, res) => {
  const { boardId, cardId, taskId } = req.params;
  const { memberId } = req.body;

  if (!memberId) {
    return res.status(400).json({ error: 'Thiếu memberId trong request body' });
  }

  try {
    const assignRef = db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').doc(taskId)
      .collection('assignments').doc(memberId);

    await assignRef.set({
      taskId,
      memberId,
      assignedAt: new Date().toISOString()
    });

    const io = req.app.get('io');
    io.to(boardId).emit('task_member_assigned', { boardId, cardId, taskId, memberId });

    res.status(201).json({ taskId, memberId });
  } catch (err) {
    res.status(500).json({ error: 'Không thể gán member cho task' });
  }
};

exports.getAssignedMembers = async (req, res) => {
  const { boardId, cardId, taskId } = req.params;

  try {
    const snapshot = await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').doc(taskId)
      .collection('assignments').get();

    const assignedMembers = snapshot.docs.map(doc => doc.data());

    res.status(200).json(assignedMembers);
  } catch (err) {
    res.status(500).json({ error: 'Không thể lấy danh sách thành viên được giao' });
  }
};

exports.removeAssignedMember = async (req, res) => {
  const { boardId, cardId, taskId, memberId } = req.params;

  try {
    await db.collection('boards').doc(boardId)
      .collection('cards').doc(cardId)
      .collection('tasks').doc(taskId)
      .collection('assignments').doc(memberId).delete();

    const io = req.app.get('io');
    io.to(boardId).emit('task_member_removed', { boardId, cardId, taskId, memberId });

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Không thể gỡ member khỏi task' });
  }
};

// exports.getRepositoryGithubInfo = async (req, res) => {
//   const { repositoryId } = req.params;

//   try {
//     const [owner, repo] = repositoryId.split('/');
//     if (!owner || !repo) {
//       return res.status(400).json({ error: 'repositoryId phải theo dạng owner/repo' });
//     }

//     const branchesResp = await octokit.repos.listBranches({ owner, repo });
//     const branches = branchesResp.data.map(b => ({
//       name: b.name,
//       lastCommitSha: b.commit.sha
//     }));

//     const pullsResp = await octokit.pulls.list({ owner, repo, state: 'open' });
//     const pulls = pullsResp.data.map(p => ({
//       title: p.title,
//       pullNumber: p.number
//     }));

//     const issuesResp = await octokit.issues.listForRepo({ owner, repo, state: 'open' });
//     const issues = issuesResp.data
//       .filter(issue => !issue.pull_request)
//       .map(issue => ({
//         title: issue.title,
//         issueNumber: issue.number
//       }));

//     const commitsResp = await octokit.repos.listCommits({ owner, repo, per_page: 30 });
//     const commits = commitsResp.data.map(c => ({
//       sha: c.sha,
//       message: c.commit.message
//     }));

//     res.status(200).json({
//       repositoryId,
//       branches,
//       pulls,
//       issues,
//       commits
//     });
//   } catch (err) {
//     console.error('Error getRepositoryGithubInfo:', err);
//     res.status(500).json({ error: 'Không thể lấy thông tin GitHub repository' });
//   }
// };

// exports.attachGithubToTask = async (req, res) => {
//   const { boardId, cardId, taskId } = req.params;
//   const { type, number, sha } = req.body;

//   if (!['pull_request', 'commit', 'issue'].includes(type)) {
//     return res.status(400).json({ error: 'type phải là pull_request, commit hoặc issue' });
//   }
//   if ((type === 'commit' && !sha) || ((type === 'pull_request' || type === 'issue') && !number)) {
//     return res.status(400).json({ error: 'Thiếu số pull request/issue hoặc sha commit' });
//   }

//   try {
//     const attachmentData = { type, createdAt: new Date().toISOString() };
//     if (type === 'commit') attachmentData.sha = sha;
//     else attachmentData.number = number;

//     const attachRef = await db.collection('boards').doc(boardId)
//       .collection('cards').doc(cardId)
//       .collection('tasks').doc(taskId)
//       .collection('github_attachments').add(attachmentData);

//     res.status(201).json({
//       taskId,
//       attachmentId: attachRef.id,
//       ...attachmentData
//     });
//   } catch (err) {
//     console.error('Error attachGithubToTask:', err);
//     res.status(500).json({ error: 'Không thể gắn GitHub attachment vào task' });
//   }
// };

// exports.getGithubAttachments = async (req, res) => {
//   const { boardId, cardId, taskId } = req.params;

//   try {
//     const snapshot = await db.collection('boards').doc(boardId)
//       .collection('cards').doc(cardId)
//       .collection('tasks').doc(taskId)
//       .collection('github_attachments').get();

//     const attachments = snapshot.docs.map(doc => ({
//       attachmentId: doc.id,
//       ...doc.data()
//     }));

//     res.status(200).json(attachments);
//   } catch (err) {
//     console.error('Error getGithubAttachments:', err);
//     res.status(500).json({ error: 'Không thể lấy danh sách GitHub attachments' });
//   }
// };

// exports.deleteGithubAttachment = async (req, res) => {
//   const { boardId, cardId, taskId, attachmentId } = req.params;

//   try {
//     await db.collection('boards').doc(boardId)
//       .collection('cards').doc(cardId)
//       .collection('tasks').doc(taskId)
//       .collection('github_attachments').doc(attachmentId).delete();

//     res.status(204).send();
//   } catch (err) {
//     console.error('Error deleteGithubAttachment:', err);
//     res.status(500).json({ error: 'Không thể xóa GitHub attachment' });
//   }
// };

exports.changecard = async (req, res) => {
  const { taskId, boardId } = req.params;
  const { fromCardId, toCardId } = req.body;

  try {
    const sourceRef = db.doc(`boards/${boardId}/cards/${fromCardId}/tasks/${taskId}`);
    const destRef = db.doc(`boards/${boardId}/cards/${toCardId}/tasks/${taskId}`);

    const snapshot = await sourceRef.get();
    if (!snapshot.exists) {
      return res.status(404).json({ message: 'Task không tồn tại trong card nguồn.' });
    }

    const taskData = snapshot.data();
    await destRef.set(taskData);
    await sourceRef.delete();

    return res.status(200).json({ message: 'Di chuyển task thành công.' });
  } catch (error) {
    console.error('Lỗi khi di chuyển task:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi khi di chuyển task.' });
  }
}