import Router from 'koa-router';
import * as postController from '../controllers/postController';

const router = new Router({ prefix: '/api/posts' });

/** GET /api/posts — 获取博客列表（支持分页、分类筛选、关键词搜索） */
router.get('/', postController.getAll);

/** GET /api/posts/:id — 获取博客详情 */
router.get('/:id', postController.getById);

/** POST /api/posts — 创建博客 */
router.post('/', postController.create);

/** PUT /api/posts/:id — 更新博客 */
router.put('/:id', postController.update);

/** DELETE /api/posts/:id — 删除博客 */
router.delete('/:id', postController.remove);

export default router;
