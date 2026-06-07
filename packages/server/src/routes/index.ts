import Router from 'koa-router';
import categoriesRouter from './categories';
import postsRouter from './posts';

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

export default router;
