import Router from 'koa-router';
import {
  getConversations,
  createConversation,
  deleteConversation,
  getMessages,
  chat,
  summarize,
} from '../controllers/aiController';

const router = new Router();

// 对话管理
router.get('/api/ai/conversations', getConversations);
router.post('/api/ai/conversations', createConversation);
router.delete('/api/ai/conversations/:id', deleteConversation);

// 消息
router.get('/api/ai/conversations/:id/messages', getMessages);

// 流式问答
router.post('/api/ai/chat', chat);

// 博客总结
router.post('/api/ai/summarize/:postId', summarize);

export default router;
