import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new NextResponse(JSON.stringify({ error: '未找到上传的文件' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 检查文件类型
        if (!file.name.endsWith('.docx')) {
            return new NextResponse(JSON.stringify({ error: '只支持 .docx 格式的文件' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 确保 public/word 目录存在
        const wordDir = path.join(process.cwd(), 'public', 'word');

        try {
            await fs.access(wordDir);
        } catch {
            // 如果目录不存在，创建它
            await fs.mkdir(wordDir, { recursive: true });
        }

        // 将文件保存到临时目录
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 确保文件名唯一
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(wordDir, fileName);

        try {
            await writeFile(filePath, buffer);

            return new NextResponse(JSON.stringify({ 
                message: '文件上传成功',
                filePath: `/word/${fileName}` // 返回相对路径
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            console.error('文件写入失败:', error);
            return new NextResponse(JSON.stringify({ error: '文件写入失败' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    } catch (error) {
        console.error('文件上传失败:', error);
        return new NextResponse(JSON.stringify({ error: '文件上传失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}