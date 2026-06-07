import Koa from 'koa';
import cors from '@koa/cors';
import bodyparser from 'koa-bodyparser';
import { errorHandler } from './middleware';
import router from './routes';

const app = new Koa();

// 注册中间件
app.use(errorHandler);
app.use(cors());
app.use(bodyparser());

// 注册路由
app.use(router.routes());
app.use(router.allowedMethods());

export default app;
