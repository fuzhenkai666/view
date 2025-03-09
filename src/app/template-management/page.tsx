'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import type { Editor as TinyMCEEditor } from 'tinymce';

interface TemplateFile {
    name: string;
    format: string;
    size: string;
    path: string;
}

export default function TemplateManagementPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<TemplateFile[]>([]);
    const [previewContent, setPreviewContent] = useState<string>('');
    const [showPreview, setShowPreview] = useState(false);
    const [error, setError] = useState<string>('');
    const [editingTemplate, setEditingTemplate] = useState<string>('');
    const [editContent, setEditContent] = useState<string>('');
    const editorRef = useRef<TinyMCEEditor | null>(null);

    useEffect(() => {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        if (isAuthenticated !== 'true') {
            router.push('/password');
        }
        loadTemplates();
    }, [router]);

    const loadTemplates = async () => {
        try {
            const response = await fetch('/api/templates');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('返回的数据格式不正确！');
            }
            const data = await response.json();
            setTemplates(data);
        } catch (error) {
            console.error('Error loading templates:', error);
            alert('加载模板列表失败：' + (error instanceof Error ? error.message : '未知错误'));
        }
    };

    const handlePreview = async (templatePath: string) => {
        try {
            setError('');
            const response = await fetch(`/api/preview?path=${encodeURIComponent(templatePath)}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '预览文件失败');
            }
            const data = await response.json();
            if (data.html) {
                setPreviewContent(data.html);
                setShowPreview(true);
            } else {
                throw new Error('预览内容为空');
            }
        } catch (error) {
            console.error('Error previewing template:', error);
            setError(error instanceof Error ? error.message : '预览文件时发生未知错误');
            alert('预览失败：' + (error instanceof Error ? error.message : '未知错误'));
        }
    };

    const handleEdit = async (templatePath: string) => {
        try {
            setError('');
            const response = await fetch(`/api/preview?path=${encodeURIComponent(templatePath)}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '加载文件失败');
            }
            const data = await response.json();
            if (data.html) {
                setEditContent(data.html);
                setEditingTemplate(templatePath);
            } else {
                throw new Error('文件内容为空');
            }
        } catch (error) {
            console.error('Error loading template for edit:', error);
            setError(error instanceof Error ? error.message : '加载文件时发生未知错误');
            alert('加载失败：' + (error instanceof Error ? error.message : '未知错误'));
        }
    };

    const handleSave = async () => {
        try {
            const response = await fetch('/api/save-template', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: editingTemplate,
                    content: editContent,
                }),
            });

            if (!response.ok) {
                throw new Error('保存失败');
            }

            setEditingTemplate('');
            setEditContent('');
            await loadTemplates();
            alert('保存成功');
        } catch (error) {
            console.error('Error saving template:', error);
            alert('保存失败：' + (error instanceof Error ? error.message : '未知错误'));
        }
    };

    const handleDelete = async (templatePath: string) => {
        try {
            const response = await fetch(`/api/delete-template?path=${encodeURIComponent(templatePath)}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '删除模板失败');
            }
            await loadTemplates(); // 重新加载模板列表
            alert('模板删除成功');
        } catch (error) {
            console.error('删除模板失败:', error);
            alert('删除模板失败：' + (error instanceof Error ? error.message : '未知错误'));
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.docx')) {
            alert('请上传 .docx 格式的文件');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload-template', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('上传失败');
            }

            await loadTemplates(); // 重新加载模板列表
            alert('模板上传成功');
        } catch (error) {
            console.error('Error uploading template:', error);
            alert('上传失败：' + (error instanceof Error ? error.message : '未知错误'));
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-24 bg-gray-100 relative">
            <button
                onClick={() => router.push('/menu')}
                className="absolute top-8 left-8 p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                </svg>
            </button>
            <div className="w-full max-w-6xl space-y-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">模板管理</h1>
                    <div>
                        <input
                            type="file"
                            accept=".docx"
                            onChange={handleUpload}
                            className="hidden"
                            id="template-upload"
                        />
                        <label
                            htmlFor="template-upload"
                            className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer transition-colors"
                        >
                            <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            增加模板
                        </label>
                    </div>
                </div>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {error}
                    </div>
                )}
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">模板名称</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">格式</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文件大小</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {templates.map((template, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{template.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.format}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.size}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                        <button
                                            onClick={() => handlePreview(template.path)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            预览
                                        </button>
                                        <button
                                            onClick={() => handleEdit(template.path)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            编辑
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.path)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            删除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">文档预览</h2>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                关闭
                            </button>
                        </div>
                        <div
                            className="prose max-w-none preview-content"
                            dangerouslySetInnerHTML={{ __html: previewContent }}
                        />
                    </div>
                </div>
            )}

            {editingTemplate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">编辑模板</h2>
                            <div className="flex space-x-4">
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    保存
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingTemplate('');
                                        setEditContent('');
                                    }}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                        <Editor
                            apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                            onInit={(evt: any, editor: TinyMCEEditor) => {
                                editorRef.current = editor;
                            }}
                            value={editContent}
                            onEditorChange={(content: string) => setEditContent(content)}
                            init={{
                                height: 500,
                                menubar: true,
                                plugins: [
                                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                                ],
                                toolbar: 'undo redo | blocks | ' +
                                    'bold italic forecolor | alignleft aligncenter ' +
                                    'alignright alignjustify | bullist numlist outdent indent | ' +
                                    'removeformat | help',
                                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                            }}
                        />
                    </div>
                </div>
            )}
        </main>
    );
}