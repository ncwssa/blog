/**
 * AI 模型数据模型
 */
import { getDatabase } from '../database';
import { supportsEmbedding } from '../ai/factory';

/** 创建模型参数 */
interface CreateModelParams {
  provider: string;
  name: string;
  modelId: string;
  apiKey: string;
  baseUrl?: string;
  config?: Record<string, any>;
  isDefault?: boolean;
}

/** 更新模型参数 */
interface UpdateModelParams {
  name?: string;
  modelId?: string;
  apiKey?: string;
  baseUrl?: string;
  config?: Record<string, any>;
  isDefault?: boolean;
  isEnabled?: boolean;
}

/** 查询所有模型 */
export function findAllModels() {
  const db = getDatabase();
  const models = db
    .prepare(
      `SELECT id, provider, name, model_id, api_key, base_url, is_default, is_enabled, config, created_at, updated_at
       FROM ai_models
       ORDER BY is_default DESC, id ASC`
    )
    .all();

  return models.map((m: any) => ({
    ...m,
    config: JSON.parse(m.config || '{}'),
    supportsEmbedding: supportsEmbedding(m.provider),
  }));
}

/** 根据 ID 查询模型 */
export function findModelById(id: number) {
  const db = getDatabase();
  const model = db
    .prepare(
      `SELECT id, provider, name, model_id, api_key, base_url, is_default, is_enabled, config, created_at, updated_at
       FROM ai_models WHERE id = ?`
    )
    .get(id) as any;

  if (!model) return null;
  return {
    ...model,
    config: JSON.parse(model.config || '{}'),
    supportsEmbedding: supportsEmbedding(model.provider),
  };
}

/** 创建模型 */
export function createModel(params: CreateModelParams) {
  const db = getDatabase();

  // 如果是默认模型，先将其他模型的 is_default 设为 0
  if (params.isDefault) {
    db.prepare('UPDATE ai_models SET is_default = 0').run();
  }

  const result = db
    .prepare(
      `INSERT INTO ai_models (provider, name, model_id, api_key, base_url, is_default, config)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      params.provider,
      params.name,
      params.modelId,
      params.apiKey,
      params.baseUrl || '',
      params.isDefault ? 1 : 0,
      JSON.stringify(params.config || {})
    );

  return { id: Number(result.lastInsertRowid) };
}

/** 更新模型 */
export function updateModel(id: number, params: UpdateModelParams) {
  const db = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if (params.name !== undefined) {
    fields.push('name = ?');
    values.push(params.name);
  }
  if (params.modelId !== undefined) {
    fields.push('model_id = ?');
    values.push(params.modelId);
  }
  if (params.apiKey !== undefined) {
    fields.push('api_key = ?');
    values.push(params.apiKey);
  }
  if (params.baseUrl !== undefined) {
    fields.push('base_url = ?');
    values.push(params.baseUrl);
  }
  if (params.config !== undefined) {
    fields.push('config = ?');
    values.push(JSON.stringify(params.config));
  }
  if (params.isEnabled !== undefined) {
    fields.push('is_enabled = ?');
    values.push(params.isEnabled ? 1 : 0);
  }

  // 如果设为默认模型，先将其他取消
  if (params.isDefault) {
    db.prepare('UPDATE ai_models SET is_default = 0').run();
    fields.push('is_default = 1');
  } else if (params.isDefault === false) {
    fields.push('is_default = 0');
  }

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE ai_models SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

/** 删除模型 */
export function deleteModel(id: number) {
  const db = getDatabase();
  db.prepare('DELETE FROM ai_models WHERE id = ?').run(id);
}
