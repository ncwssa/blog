import Router from 'koa-router';
import * as aiModelController from '../controllers/aiModelController';

const router = new Router({ prefix: '/api/ai-models' });

// 获取所有模型
router.get('/', aiModelController.getAllModels);

// 获取单个模型
router.get('/:id', aiModelController.getModelById);

// 创建模型
router.post('/', aiModelController.createModel);

// 更新模型
router.put('/:id', aiModelController.updateModel);

// 删除模型
router.delete('/:id', aiModelController.deleteModel);

// 测试模型连接
router.post('/:id/test', aiModelController.testModel);

export default router;
