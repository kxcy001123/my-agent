import { Inject, Injectable } from '@nestjs/common';
import { FEISHU_CLIENT } from './feishu-client.token';
import { Client } from '@larksuiteoapi/node-sdk';

@Injectable()
export class FeishuDocService {
  constructor(
    @Inject(FEISHU_CLIENT) private readonly feishuClient: Client,
  ) {}

  // 解析飞书文档内容（核心：获取 PRD 文本）
  async getDocContent(url: string): Promise<string> {
        // 1. 判断链接类型
    if (url.includes('feishu.cn/doc/')) {
      return this.getNormalDocContent(url);
    } else if (url.includes('feishu.cn/wiki/')) {
      return this.getWikiDocContent(url);
    } else {
      throw new Error('不支持的文档链接类型，请使用 feishu.cn/doc/ 或 feishu.cn/wiki/ 链接');
    }
  }

   /**
   * 解析普通文档（feishu.cn/doc/）
   */
  private async getNormalDocContent(url: string): Promise<string> {
    try {
      // 提取文档 ID（doc/ 后到第一个非字母数字前）
      const docIdMatch = url.match(/doc\/([a-zA-Z0-9]+)/);
      if (!docIdMatch) throw new Error('无法解析普通文档 ID');
      const docId = docIdMatch[1];

      // 调用普通文档 API
      const response = await this.feishuClient.docx.document.get({
        path: { document_id: docId },
      });

      // 提取标题 + 内容（简化处理，可根据需要解析富文本）
      // 注意：飞书 docx 文档的内容需要通过 docx.block.batchGet 获取，这里先返回标题
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
  private async getWikiDocContent(url: string): Promise<string> {
    try {
      // 提取 Wiki Page ID（wiki/ 后到第一个 ? 或 / 前）
      const wikiIdMatch = url.match(/wiki\/([a-zA-Z0-9]+)/);
      if (!wikiIdMatch) throw new Error('无法解析 Wiki 文档 ID');
      const pageId = wikiIdMatch[1];

      // 调用 Wiki 专属 API - 使用 wiki.space.getNode 获取 Wiki 节点信息
      // 注意：getNode 需要 token 参数，这里使用 pageId 作为 token
      const response = await this.feishuClient.wiki.space.getNode({
        params: { token: pageId, obj_type: 'wiki' },
      });

      const objToken = response.data?.node?.obj_token;
      const objType = response.data?.node?.obj_type; 

      let content = '';

      if (objType === 'docx' && objToken) {
        // 新版文档 - 获取文档所有块
        const blocks = await this.feishuClient.docx.documentBlock.list({
          path: { document_id: objToken }
        });
        // 处理文档块内容
        content = JSON.stringify(blocks.data?.items)
      }

      // 提取标题 + 内容（Wiki 内容在 title 字段）
      return `【Wiki 知识库文档】
标题：${response.data?.node?.title || '未知'}
所属空间：${response.data?.node?.space_id || '未知'}
内容：${content || '无内容'}`;
    } catch (err) {
      console.error('读取 Wiki 文档失败:', err);
      throw new Error(`Wiki 文档读取失败：${err.message}`);
    }
  }
}
