import { Inject, Injectable } from '@nestjs/common';
import { FEISHU_CLIENT } from './feishu-client.token';
import { Client } from '@larksuiteoapi/node-sdk';
import * as axios from 'axios';
import sharp from 'sharp';

/**
 * 飞书文档内容块类型
 */
interface DocContentBlock {
  type: 'text' | 'image' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'ordered_list' | 'quote' | 'code' | 'table';
  content?: string;
  url?: string;
  children?: DocContentBlock[];
}

/**
 * 大模型消息内容格式
 */
interface LLMContentItem {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

/**
 * 结构化文档内容（文本 + 图片）
 */
export interface StructuredDocContent {
  text: string;
  images: string[];  // base64 格式的图片数组
}

@Injectable()
export class FeishuDocService {
  constructor(
    @Inject(FEISHU_CLIENT) private readonly feishuClient: Client,
  ) {}

  /**
   * 解析飞书文档内容（支持文本和图片）
   * @param url 飞书文档 URL
   * @param forLLM 是否为大模型格式输出（支持图片识别）
   */
  async getDocContent(url: string, forLLM = false): Promise<string | StructuredDocContent> {
    // 1. 判断链接类型
    if (url.includes('feishu.cn/doc/')) {
      return this.getNormalDocContent(url, forLLM);
    } else if (url.includes('feishu.cn/wiki/')) {
      return this.getWikiDocContent(url, forLLM);
    } else {
      throw new Error('不支持的文档链接类型，请使用 feishu.cn/doc/ 或 feishu.cn/wiki/ 链接');
    }
  }

  /**
   * 解析普通文档（feishu.cn/doc/）
   */
  private async getNormalDocContent(url: string, forLLM = false): Promise<string | StructuredDocContent> {
    try {
      // 提取文档 ID（doc/ 后到第一个非字母数字前）
      const docIdMatch = url.match(/doc\/([a-zA-Z0-9]+)/);
      if (!docIdMatch) throw new Error('无法解析普通文档 ID');
      const docId = docIdMatch[1];

      // 调用普通文档 API 获取文档信息
      const response = await this.feishuClient.docx.document.get({
        path: { document_id: docId },
      });

      const objToken = docId;
      const objType = 'docx';

      if (objType === 'docx' && objToken) {
        return this.parseDocxContent(objToken, response.data?.document?.title, forLLM);
      }

      return `【普通文档】
标题：${response.data?.document?.title}
内容：${JSON.stringify(response.data || '无内容')}`;
    } catch (err) {
      console.error('读取普通文档失败:', err);
      throw new Error(`普通文档读取失败：${err.message}`);
    }
  }

  /**
   * 解析 Wiki 文档（feishu.cn/wiki/）
   */
  private async getWikiDocContent(url: string, forLLM = false): Promise<string | StructuredDocContent> {
    try {
      // 提取 Wiki Page ID（wiki/ 后到第一个？或 / 前）
      const wikiIdMatch = url.match(/wiki\/([a-zA-Z0-9]+)/);
      if (!wikiIdMatch) throw new Error('无法解析 Wiki 文档 ID');
      const pageId = wikiIdMatch[1];

      // 调用 Wiki 专属 API - 使用 wiki.space.getNode 获取 Wiki 节点信息
      const response = await this.feishuClient.wiki.space.getNode({
        params: { token: pageId, obj_type: 'wiki' },
      });

      const objToken = response.data?.node?.obj_token;
      const objType = response.data?.node?.obj_type;

      if (objType === 'docx' && objToken) {
        return this.parseDocxContent(objToken, response.data?.node?.title, forLLM);
      }

      // 提取标题 + 内容（Wiki 内容在 title 字段）
      return `【Wiki 知识库文档】
标题：${response.data?.node?.title || '未知'}
所属空间：${response.data?.node?.space_id || '未知'}
内容：无内容`;
    } catch (err) {
      console.error('读取 Wiki 文档失败:', err);
      throw new Error(`Wiki 文档读取失败：${err.message}`);
    }
  }

  /**
   * 解析 Docx 文档内容（核心方法）
   * @param objToken 文档对象 token
   * @param title 文档标题
   * @param forLLM 是否为大模型格式输出
   */
  private async parseDocxContent(objToken: string, title: string | undefined, forLLM = false): Promise<string | StructuredDocContent> {
    // 1. 获取文档所有块
    const blocksRes = await this.feishuClient.docx.documentBlock.list({
      path: { document_id: objToken }
    });
    const blocks = blocksRes.data?.items || [];

    // 2. 收集所有图片 token（递归表格/列表/嵌套块）
    const imageTokens: string[] = [];
    this.collectImages(blocks, imageTokens);
    // 3. 批量获取图片临时 URL（飞书官方接口）
    const imageUrlMap: Record<string, string> = {};
    if (imageTokens.length) {
      try {
        const urlRes = await this.feishuClient.drive.v1.media.batchGetTmpDownloadUrl({
          params: {
            file_tokens: imageTokens
          }
        });
        for (const item of urlRes.data?.tmp_download_urls || []) {
          imageUrlMap[item.file_token] = item.tmp_download_url;
        }
      } catch (err) {
        console.error('获取图片临时 URL 失败:', err);
      }
    }

    // 3.5 将图片 URL 转换为 base64（大模型识别需要）
    const imageBase64Map: Record<string, string> = {};
    if (forLLM && Object.keys(imageUrlMap).length > 0) {
      for (const [token, url] of Object.entries(imageUrlMap)) {
        try {
          const base64 = await this.urlToBase64(url);
          imageBase64Map[token] = base64;
        } catch (err) {
          console.error(`图片转 base64 失败 (${token}):`, err.message);
        }
      }
    }

    // 4. 解析文档为 文本 + 图片（大模型可用格式）
    const fullContent = this.parseBlocks(blocks, imageUrlMap, imageBase64Map);

    // 5. 根据 forLLM 参数决定返回格式
    if (forLLM) {
      // 🔥 组装成结构化数据（文本 + 图片数组）
      const textParts: string[] = [];
      const images: string[] = [];
      
      for (const item of fullContent) {
        if (item.type === 'image' && item.url) {
          // 收集图片 base64
          images.push(item.url);
        } else if (item.content) {
          // 收集文本
          textParts.push(item.content);
        }
      }
      
      const result: StructuredDocContent = {
        text: textParts.join('\n'),
        images: images
      };
      console.log("document content for LLM - text length:", result.text.length, ", images count:", result.images.length);
      return result;
    } else {
      // 返回结构化内容
      return `【文档】
标题：${title || '未知'}
内容：${JSON.stringify(fullContent, null, 2)}`;
    }
  }

  /**
   * 递归收集所有图片 token
   */
  private collectImages(blocks: any[], imageTokens: string[]): void {
    for (const b of blocks) {
      // 图片块（block_type === 27）
      if (b.block_type === 27 && b.image?.token) {
        imageTokens.push(b.image.token);
      }
      // 递归处理子块（表格、列表、嵌套块等）
      if (b.children?.length) {
        this.collectImages(b.children, imageTokens);
      }
    }
  }

  /**
   * 解析文档块为结构化内容
   */
  private parseBlocks(blocks: any[], imageUrlMap: Record<string, string>, imageBase64Map: Record<string, string> = {}): DocContentBlock[] {
    const result: DocContentBlock[] = [];
    
    for (const b of blocks) {
      // 图片
      if (b.block_type === 27) {
        result.push({
          type: 'image',
          url: imageBase64Map[b.image?.token] || imageUrlMap[b.image?.token]
        });
      }
      // 文本段落
      else if (b.block_type === 2 && b.text?.elements) {
        const content = b.text.elements.map(e => e.text_run?.content || '').join('');
        if (content.trim()) {
          result.push({
            type: 'text',
            content
          });
        }
      }
      // 标题 1
      else if (b.block_type === 3 && b.heading1?.elements) {
        result.push({
          type: 'heading1',
          content: b.heading1.elements.map(e => e.text_run?.content || '').join('')
        });
      }
      // 标题 2
      else if (b.block_type === 4 && b.heading2?.elements) {
        result.push({
          type: 'heading2',
          content: b.heading2.elements.map(e => e.text_run?.content || '').join('')
        });
      }
      // 标题 3
      else if (b.block_type === 5 && b.heading3?.elements) {
        result.push({
          type: 'heading3',
          content: b.heading3.elements.map(e => e.text_run?.content || '').join('')
        });
      }
      // 项目符号列表
      else if (b.block_type === 6 && b.bullet?.elements) {
        result.push({
          type: 'bullet',
          content: b.bullet.elements.map(e => e.text_run?.content || '').join('')
        });
      }
      // 有序列表
      else if (b.block_type === 7 && b.ordered_list?.elements) {
        result.push({
          type: 'ordered_list',
          content: b.ordered_list.elements.map(e => e.text_run?.content || '').join('')
        });
      }
      // 引用
      else if (b.block_type === 8 && b.quote?.elements) {
        result.push({
          type: 'quote',
          content: b.quote.elements.map(e => e.text_run?.content || '').join('')
        });
      }
      // 代码块
      else if (b.block_type === 9 && b.code?.elements) {
        result.push({
          type: 'code',
          content: b.code.elements.map(e => e.text_run?.content || '').join('')
        });
      }
      // 表格
      else if (b.block_type === 11) {
        result.push({
          type: 'table',
          children: this.parseBlocks(b.children || [], imageUrlMap)
        });
      }
      // 递归处理子块
      if (b.children?.length && b.block_type !== 11) {
        const children = this.parseBlocks(b.children, imageUrlMap);
        result.push(...children);
      }
    }
    
    return result;
  }

  /**
   * 将解析内容组装成大模型消息格式
   * @param content 解析后的内容
   */
  formatForLLM(content: DocContentBlock[]): any[] {
    return [{
      role: 'user',
      content: content.map(item => {
        if (item.type === 'image' && item.url) {
          return { type: 'image_url', image_url: { url: item.url } };
        } else {
          return { type: 'text', text: item.content || '' };
        }
      }).filter(i => i.text || i.image_url)
    }];
  }

  /**
   * 将图片 URL 转换为 base64 格式（带压缩）
   * @param url 图片下载 URL
   * @returns base64 格式字符串 (data:image/png;base64,xxxx)
   */
  private async urlToBase64(url: string): Promise<string> {
    const response = await axios.default.get(url, {
      responseType: 'arraybuffer'
    });
    const imageData = response.data as Buffer;
    const contentType = response.headers['content-type'] || 'image/png';

    // 使用 sharp 压缩图片
    const compressedImage = await sharp(imageData)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true }) // 限制最大尺寸
      .jpeg({ quality: 70 }) // 转换为 JPEG 并压缩
      .toBuffer();

    const base64 = compressedImage.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  }
}
