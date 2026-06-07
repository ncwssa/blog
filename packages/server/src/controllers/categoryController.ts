import { Context } from 'koa';
import * as categoryModel from '../models/categoryModel';

/**
 * 分类控制器 — 参数校验和响应格式化
 */

/** 获取所有分类列表 */
export function getAll(ctx: Context) {
  const categories = categoryModel.findAll();
  ctx.body = {
    code: 0,
    message: 'success',
    data: categories,
  };
}

/** 创建自定义分类 */
export function create(ctx: Context) {
  const { name } = ctx.request.body as any;

  // 参数校验
  if (!name || !name.trim()) {
    ctx.body = { code: 400, message: '分类名称不能为空', data: null };
    ctx.status = 400;
    return;
  }

  // 检查名称是否重复
  const existing = categoryModel.findByName(name.trim());
  if (existing) {
    ctx.body = { code: 400, message: '分类名称已存在', data: null };
    ctx.status = 400;
    return;
  }

  const result = categoryModel.create(name.trim());
  ctx.body = {
    code: 0,
    message: '创建成功',
    data: { id: Number(result.id) },
  };
}

/** 更新分类名称 */
export function update(ctx: Context) {
  const id = Number(ctx.params.id);
  const { name } = ctx.request.body as any;

  // 参数校验
  if (!name || !name.trim()) {
    ctx.body = { code: 400, message: '分类名称不能为空', data: null };
    ctx.status = 400;
    return;
  }

  // 检查分类是否存在
  const category = categoryModel.findById(id) as any;
  if (!category) {
    ctx.body = { code: 404, message: '分类不存在', data: null };
    ctx.status = 404;
    return;
  }

  // 不能修改预设分类
  if (category.is_preset === 1) {
    ctx.body = { code: 400, message: '预设分类不可修改', data: null };
    ctx.status = 400;
    return;
  }

  // 检查名称是否重复（排除自身）
  const existing = categoryModel.findByName(name.trim()) as any;
  if (existing && existing.id !== id) {
    ctx.body = { code: 400, message: '分类名称已存在', data: null };
    ctx.status = 400;
    return;
  }

  categoryModel.update(id, name.trim());
  ctx.body = { code: 0, message: '更新成功', data: null };
}

/** 删除分类 */
export function remove(ctx: Context) {
  const id = Number(ctx.params.id);

  // 检查分类是否存在
  const category = categoryModel.findById(id) as any;
  if (!category) {
    ctx.body = { code: 404, message: '分类不存在', data: null };
    ctx.status = 404;
    return;
  }

  // 不能删除预设分类
  if (category.is_preset === 1) {
    ctx.body = { code: 400, message: '预设分类不可删除', data: null };
    ctx.status = 400;
    return;
  }

  // 删除分类（模型层会自动将关联文章的 category_id 设为 null）
  categoryModel.deleteCategoryById(id);
  ctx.body = { code: 0, message: '删除成功', data: null };
}
