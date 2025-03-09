import { NextResponse } from 'next/server';
import path from 'path';
import { writeFile, mkdir, access, readdir } from 'fs/promises';
import os from 'os';
import { join } from 'path';

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
            await access(wordDir);
        } catch (error) {
            // 如果目录不存在，创建它
            await mkdir(wordDir, { recursive: true });
        }

        // 将文件保存到 public/word 目录
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 获取文件名（不包含扩展名）
        const fileNameWithoutExt = file.name.replace(/\.docx$/, '');
        const extension = '.docx';

        // 检查是否存在同名文件，如果存在则添加序号
        const files = await readdir(wordDir);
        let finalFileName = file.name;
        let counter = 1;

        while (files.includes(finalFileName)) {
            finalFileName = `${fileNameWithoutExt} (${counter})${extension}`;
            counter++;
        }

        const filePath = path.join(wordDir, finalFileName);
        await writeFile(filePath, buffer);

        return new NextResponse(JSON.stringify({ message: '文件上传成功' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('文件上传失败:', error);
        return new NextResponse(JSON.stringify({ error: '文件上传失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}