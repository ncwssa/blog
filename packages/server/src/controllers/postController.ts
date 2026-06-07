import { Context } from 'koa';
import * as postModel from '../models/postModel';

/**
 * 博客控制器 — 参数校验和响应格式化
 */

/** 获取博客列表（分页、筛选、搜索） */
export function getAll(ctx: Context) {
  const {
    page = '1',
    pageSize = '10',
    categoryId,
    keyword,
    sortBy = 'created_at',
    order = 'desc',
  } = ctx.query as Record<string, string>;

  const params = {
    page: Math.max(1, Number(page) || 1),
    pageSize: Math.max(1, Math.min(100, Number(pageSize) || 10)),
    categoryId: categoryId ? Number(categoryId) : undefined,
    keyword: keyword || undefined,
    sortBy,
    order,
  };

  const result = postModel.findAll(params);
  ctx.body = {
    code: 0,
    message: 'success',
    data: result,
  };
}

/** 获取博客详情 */
export function getById(ctx: Context) {
  const id = Number(ctx.params.id);

  const post = postModel.findById(id);
  if (!post) {
    ctx.body = { code: 404, message: '文章不存在', data: null };
    return;
  }

  ctx.body = { code: 0, message: 'success', data: post };
}

/** 创建博客 */
export function create(ctx: Context) {
  const { title, content, categoryIds } = ctx.request.body as any;

  // 参数校验
  if (!title || !title.trim()) {
    ctx.body = { code: 400, message: '文章标题不能为空', data: null };
    ctx.status = 400;
    return;
  }

  if (!content || !content.trim()) {
    ctx.body = { code: 400, message: '文章内容不能为空', data: null };
    ctx.status = 400;
    return;
  }

  const result = postModel.create({
    title: title.trim(),
    content,
    categoryIds: categoryIds
      ? (Array.isArray(categoryIds) ? categoryIds : [categoryIds])
          .map(Number)
          .filter((id: number) => !isNaN(id) && id > 0)
      : undefined,
  });

  // 返回创建的文章完整信息
  const post = postModel.findById(Number(result.id));
  ctx.body = {
    code: 0,
    message: '创建成功',
    data: post,
  };
}

/** 更新博客 */
export function update(ctx: Context) {
  const id = Number(ctx.params.id);
  const { title, content, categoryIds } = ctx.request.body as any;

  // 检查文章是否存在
  const existing = postModel.findById(id);
  if (!existing) {
    ctx.body = { code: 404, message: '文章不存在', data: null };
    ctx.status = 404;
    return;
  }

  // 构建更新数据
  const updateData: { title?: string; content?: string; categoryIds?: number[] } = {};

  if (title !== undefined) {
    if (!title.trim()) {
      ctx.body = { code: 400, message: '文章标题不能为空', data: null };
      ctx.status = 400;
      return;
    }
    updateData.title = title.trim();
  }

  if (content !== undefined) {
    if (!content.trim()) {
      ctx.body = { code: 400, message: '文章内容不能为空', data: null };
      ctx.status = 400;
      return;
    }
    updateData.content = content;
  }

  if (categoryIds !== undefined) {
    updateData.categoryIds = (Array.isArray(categoryIds) ? categoryIds : [categoryIds])
      .map(Number)
      .filter((id: number) => !isNaN(id) && id > 0);
  }

  postModel.update(id, updateData);

  // 返回更新后的文章
  const post = postModel.findById(id);
  ctx.body = { code: 0, message: '更新成功', data: post };
}

/** 删除博客 */
export function remove(ctx: Context) {
  const id = Number(ctx.params.id);

  // 检查文章是否存在
  const existing = postModel.findById(id);
  if (!existing) {
    ctx.body = { code: 404, message: '文章不存在', data: null };
    ctx.status = 404;
    return;
  }

  postModel.deletePostById(id);
  ctx.body = { code: 0, message: '删除成功', data: null };
}
