import Router from 'koa-router';
import * as categoryController from '../controllers/categoryController';

const router = new Router({ prefix: '/api/categories' });

/** GET /api/categories — 获取所有分类列表 */
router.get('/', categoryController.getAll);

/** POST /api/categories — 创建自定义分类 */
router.post('/', categoryController.create);

/** PUT /api/categories/:id — 更新分类名称 */
router.put('/:id', categoryController.update);

/** DELETE /api/categories/:id — 删除分类 */
router.delete('/:id', categoryController.remove);

export default router;
