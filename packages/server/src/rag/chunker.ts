/**
 * 文本分块（Chunking）模块
 * 将长文本按 Markdown 结构切割为适合向量化的片段
 */

interface ChunkOptions {
  maxTokens: number;
  overlap: number;
  separator: string[];
}

const defaultOptions: ChunkOptions = {
  maxTokens: 512,
  overlap: 50,
  separator: ['\n## ', '\n### ', '\n\n', '\n', '。', '. '],
};

/** 简略估算 token 数（中文约 1.5 字符/token，英文约 4 字符/token） */
function estimateTokens(text: string): number {
  let tokens = 0;
  for (const char of text) {
    if (/[\u4e00-\u9fff]/.test(char)) {
      tokens += 1.5;
    } else if (/\s/.test(char)) {
      tokens += 0.25;
    } else {
      tokens += 0.25;
    }
  }
  return Math.ceil(tokens);
}

/**
 * 按分隔符优先级递归分割文本
 */
function splitBySeparator(text: string, separators: string[], maxTokens: number): string[] {
  if (estimateTokens(text) <= maxTokens || separators.length === 0) {
    return [text];
  }

  const sep = separators[0];
  const parts: string[] = [];
  let start = 0;

  for (let i = 0; i < text.length; i++) {
    if (text.slice(i).startsWith(sep)) {
      const part = text.slice(start, i || text.length);
      if (part.trim()) {
        parts.push(part);
      }
      start = i + sep.length;
      i += sep.length - 1;
    }
  }

  // 最后一段
  const last = text.slice(start);
  if (last.trim()) {
    parts.push(last);
  }

  // 如果分隔符没有切出结果（如分隔符不存在），递归尝试下一级
  if (parts.length <= 1) {
    return splitBySeparator(text, separators.slice(1), maxTokens);
  }

  // 对每个部分递归分割
  const result: string[] = [];
  for (const part of parts) {
    const subParts = splitBySeparator(part, separators.slice(1), maxTokens);
    result.push(...subParts);
  }

  // 合并过短的片段
  return mergeShortChunks(result, maxTokens);
}

/**
 * 合并过短的片段到前一个片段中
 */
function mergeShortChunks(chunks: string[], maxTokens: number): string[] {
  if (chunks.length <= 1) return chunks;

  const result: string[] = [];
  let buffer = '';

  for (const chunk of chunks) {
    if (!buffer) {
      buffer = chunk;
      continue;
    }

    const mergedTokens = estimateTokens(buffer + '\n' + chunk);
    if (mergedTokens <= maxTokens) {
      buffer += '\n' + chunk;
    } else {
      result.push(buffer);
      buffer = chunk;
    }
  }

  if (buffer) {
    result.push(buffer);
  }

  return result;
}

/**
 * 添加重叠内容：每个片段末尾追加下一片段开头的内容
 */
function addOverlap(chunks: string[], overlapTokens: number): string[] {
  if (chunks.length <= 1 || overlapTokens <= 0) return chunks;

  return chunks.map((chunk, i) => {
    if (i === chunks.length - 1) return chunk;

    // 从下一片段中取 overlapTokens 长度的字符作为重叠
    const nextChunk = chunks[i + 1];
    const nextEstimated = estimateTokens(nextChunk);
    if (nextEstimated <= overlapTokens) {
      return chunk + '\n' + nextChunk;
    }

    // 按比例取字符数
    const ratio = overlapTokens / nextEstimated;
    const overlapChars = Math.floor(nextChunk.length * ratio);
    return chunk + '\n' + nextChunk.slice(0, overlapChars);
  });
}

/**
 * 去除 Markdown 元信息（如 YAML frontmatter 等）
 */
function stripMetadata(text: string): string {
  // 去除开头的 ---...--- YAML frontmatter
  if (text.startsWith('---')) {
    const endIndex = text.indexOf('---', 3);
    if (endIndex !== -1) {
      return text.slice(endIndex + 3).trim();
    }
  }
  return text;
}

/**
 * 将长文本分割为适合 Embedding 的文本块
 * @param text 原始 Markdown 文本
 * @param options 分块选项
 * @returns 文本块数组
 */
export function splitText(text: string, options: ChunkOptions = defaultOptions): string[] {
  const cleaned = stripMetadata(text);
  const chunks = splitBySeparator(cleaned, options.separator, options.maxTokens);

  // 如果所有块都小于 maxTokens，直接返回
  const needsOverlap = chunks.some((c) => estimateTokens(c) > options.maxTokens * 0.8);
  if (!needsOverlap) {
    return chunks;
  }

  // 对超过阈值的块进行二级分割（按字符长度硬切）
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (estimateTokens(chunk) <= options.maxTokens) {
      finalChunks.push(chunk);
    } else {
      // 硬分割：按比例切分
      const ratio = options.maxTokens / estimateTokens(chunk);
      const segmentSize = Math.floor(chunk.length * ratio);
      for (let i = 0; i < chunk.length; i += segmentSize) {
        const seg = chunk.slice(i, i + segmentSize);
        if (seg.trim()) {
          finalChunks.push(seg);
        }
      }
    }
  }

  // 添加重叠
  return addOverlap(finalChunks, options.overlap);
}

export { estimateTokens };
export type { ChunkOptions };
