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
  const { name, color } = ctx.request.body as any;

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

  const result = categoryModel.create(name.trim(), color || undefined);
  // 返回完整的分类信息
  const category = categoryModel.findById(Number(result.id));
  ctx.body = {
    code: 0,
    message: '创建成功',
    data: category,
  };
}

/** 更新分类名称和颜色 */
export function update(ctx: Context) {
  const id = Number(ctx.params.id);
  const { name, color } = ctx.request.body as any;

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
  if (name !== undefined && name.trim()) {
    const existing = categoryModel.findByName(name.trim()) as any;
    if (existing && existing.id !== id) {
      ctx.body = { code: 400, message: '分类名称已存在', data: null };
      ctx.status = 400;
      return;
    }
  }

  const updateData: { name?: string; color?: string } = {};
  if (name !== undefined && name.trim()) updateData.name = name.trim();
  if (color !== undefined) updateData.color = color;

  categoryModel.update(id, updateData);

  // 返回更新后的分类
  const updated = categoryModel.findById(id);
  ctx.body = { code: 0, message: '更新成功', data: updated };
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

  // 删除分类（模型层会自动删除 post_categories 关联）
  categoryModel.deleteCategoryById(id);
  ctx.body = { code: 0, message: '删除成功', data: null };
}
