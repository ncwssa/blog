import { Context, Next } from 'koa';

/**
 * 统一错误处理中间件
 * 捕获所有未处理的异常，返回统一 JSON 格式
 */
export async function errorHandler(ctx: Context, next: Next): Promise<void> {
  try {
    await next();
  } catch (err: any) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || '服务器内部错误';

    ctx.status = status;
    ctx.body = {
      code: status,
      message,
      data: null,
    };

    // 在控制台打印错误信息，便于调试
    console.error(`[Error] ${ctx.method} ${ctx.url} - ${message}`);
    if (status === 500) {
      console.error(err.stack || err);
    }
  }
}
