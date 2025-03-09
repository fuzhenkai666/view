import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        console.log('开始处理文件上传请求');
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.error('未找到上传的文件');
            return new NextResponse(JSON.stringify({ error: '未找到上传的文件' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        console.log('成功获取上传文件:', file.name);

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
            await fs.access(wordDir, fs.constants.W_OK);
            console.log('public/word目录存在且具有写入权限');
        } catch (error) {
            console.log('尝试创建public/word目录...');
            try {
                await fs.mkdir(wordDir, { recursive: true, mode: 0o755 });
                console.log('成功创建public/word目录');
            } catch (mkdirError) {
                console.error('创建目录失败:', mkdirError);
                throw new Error('无法创建上传目录');
            }
        }

        // 将文件保存到 public/word 目录
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 确保文件名唯一
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(wordDir, fileName);

        await writeFile(filePath, buffer);

        return new NextResponse(JSON.stringify({ message: '文件上传成功' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('文件上传失败:', error);
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        return new NextResponse(JSON.stringify({ error: `文件上传失败: ${errorMessage}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}