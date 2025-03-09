import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import HTMLToDocx from 'html-to-docx';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        console.log('开始处理模板保存请求');
        const { path: templatePath, content } = await request.json();

        if (!templatePath || !content) {
            console.error('缺少必要参数:', { templatePath, hasContent: !!content });
            return new NextResponse(JSON.stringify({ error: '缺少必要参数' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        console.log('接收到保存请求，模板路径:', templatePath);

        // 构建完整的文件路径
        const absolutePath = path.join(process.cwd(), 'public', templatePath);
        console.log('构建的完整文件路径:', absolutePath);

        // 验证文件路径是否在允许的目录内
        if (!absolutePath.startsWith(path.join(process.cwd(), 'public'))) {
            console.error('文件路径安全检查失败:', absolutePath);
            return new NextResponse(JSON.stringify({ error: '无效的文件路径' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 检查目录是否存在并具有写入权限
        try {
            const dir = path.dirname(absolutePath);
            await fs.access(dir, fs.constants.W_OK);
            console.log('目标目录存在且具有写入权限:', dir);
        } catch (error) {
            console.error('目录访问权限检查失败:', error);
            throw new Error('无法访问目标目录或缺少写入权限');

        // 将HTML内容转换为Word文档
        const docxBuffer = await HTMLToDocx(content, null, {
            table: { row: { cantSplit: true } },
            footer: false,
            pageNumber: false,
        });

        // 保存文件
        await fs.writeFile(absolutePath, docxBuffer);

        return new NextResponse(JSON.stringify({ message: '保存成功' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('保存模板失败:', error);
        return new NextResponse(JSON.stringify({ error: '保存模板失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}