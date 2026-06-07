import { Context } from 'koa';
import * as aiModelModel from '../models/aiModelModel';
import { testModelConnection } from '../rag/embedding';

/** 获取所有 AI 模型配置 */
export function getAllModels(ctx: Context) {
  const models = aiModelModel.findAllModels();
  ctx.body = { code: 0, message: 'success', data: models };
}

/** 获取单个模型 */
export function getModelById(ctx: Context) {
  const id = Number(ctx.params.id);
  const model = aiModelModel.findModelById(id);
  if (!model) {
    ctx.body = { code: 404, message: '模型不存在', data: null };
    ctx.status = 404;
    return;
  }
  ctx.body = { code: 0, message: 'success', data: model };
}

/** 创建模型 */
export function createModel(ctx: Context) {
  const { provider, name, modelId, apiKey, baseUrl, config, isDefault } = ctx.request.body as any;

  if (!provider || !name || !modelId || !apiKey) {
    ctx.body = { code: 400, message: '厂商、名称、模型 ID 和 API Key 为必填项', data: null };
    ctx.status = 400;
    return;
  }

  const result = aiModelModel.createModel({
    provider,
    name,
    modelId,
    apiKey,
    baseUrl,
    config,
    isDefault,
  });

  const model = aiModelModel.findModelById(result.id);
  ctx.body = { code: 0, message: '创建成功', data: model };
}

/** 更新模型 */
export function updateModel(ctx: Context) {
  const id = Number(ctx.params.id);
  const existing = aiModelModel.findModelById(id);
  if (!existing) {
    ctx.body = { code: 404, message: '模型不存在', data: null };
    ctx.status = 404;
    return;
  }

  const { name, modelId, apiKey, baseUrl, config, isDefault, isEnabled } = ctx.request.body as any;

  aiModelModel.updateModel(id, {
    name,
    modelId,
    apiKey,
    baseUrl,
    config,
    isDefault,
    isEnabled,
  });

  const model = aiModelModel.findModelById(id);
  ctx.body = { code: 0, message: '更新成功', data: model };
}

/** 删除模型 */
export function deleteModel(ctx: Context) {
  const id = Number(ctx.params.id);
  const existing = aiModelModel.findModelById(id);
  if (!existing) {
    ctx.body = { code: 404, message: '模型不存在', data: null };
    ctx.status = 404;
    return;
  }

  aiModelModel.deleteModel(id);
  ctx.body = { code: 0, message: '删除成功', data: null };
}

/** 测试模型连接 */
export async function testModel(ctx: Context) {
  const id = Number(ctx.params.id);
  const model = aiModelModel.findModelById(id);
  if (!model) {
    ctx.body = { code: 404, message: '模型不存在', data: null };
    ctx.status = 404;
    return;
  }

  const result = await testModelConnection({
    provider: model.provider,
    apiKey: model.api_key,
    baseUrl: model.base_url,
    modelId: model.model_id,
  });

  ctx.body = { code: 0, message: result.success ? '连接成功' : '连接失败', data: result };
}
