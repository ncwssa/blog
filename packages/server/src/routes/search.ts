import Router from 'koa-router';
import * as searchController from '../controllers/searchController';

const router = new Router({ prefix: '/api/search' });

// 语义搜索
router.post('/', searchController.search);

// 全量重建向量索引
router.post('/reindex', searchController.reindex);

// 单篇重建索引
router.post('/index/:postId', searchController.indexSinglePost);

export default router;
