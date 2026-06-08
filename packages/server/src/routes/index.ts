import Router from 'koa-router';
import categoriesRouter from './categories';
import postsRouter from './posts';
import aiModelsRouter from './ai-models';
import searchRouter from './search';
import aiRouter from './ai';

const router = new Router();

/**
 * 健康检查接口
 * GET /api/health
 */
router.get('/api/health', (ctx) => {
  ctx.body = {
    code: 200,
    message: 'OK',
    data: { status: 'running' },
  };
});

// 注册分类路由
router.use(categoriesRouter.routes());
router.use(categoriesRouter.allowedMethods());

// 注册博客路由
router.use(postsRouter.routes());
router.use(postsRouter.allowedMethods());

// 注册 AI 模型路由
router.use(aiModelsRouter.routes());
router.use(aiModelsRouter.allowedMethods());

// 注册搜索路由
router.use(searchRouter.routes());
router.use(searchRouter.allowedMethods());

// 注册 AI 路由
router.use(aiRouter.routes());
router.use(aiRouter.allowedMethods());

export default router;
