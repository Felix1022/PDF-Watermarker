
import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Download, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { WatermarkConfig, PDFFile } from './types';
import { applyWatermark } from './services/pdfService';
import SettingsPanel from './components/SettingsPanel';

const App: React.FC = () => {
  const [file, setFile] = useState<PDFFile | null>(null);
  const [config, setConfig] = useState<WatermarkConfig>({
    text: '机密文件',
    color: '#e5e7eb',
    opacity: 0.3,
    rotation: 45,
    fontSize: 50,
    spacingX: 250,
    spacingY: 250,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('请上传有效的 PDF 文件。');
        return;
      }
      setFile({
        file: selectedFile,
        name: selectedFile.name,
        size: selectedFile.size,
      });
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.type !== 'application/pdf') {
        setError('请上传有效的 PDF 文件。');
        return;
      }
      setFile({
        file: droppedFile,
        name: droppedFile.name,
        size: droppedFile.size,
      });
      setError(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setStatusMessage('准备中...');

    try {
      const arrayBuffer = await file.file.arrayBuffer();
      const watermarkedPdf = await applyWatermark(arrayBuffer, config, (status) => {
        setStatusMessage(status);
      });
      
      setStatusMessage('正在生成下载...');
      const blob = new Blob([watermarkedPdf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `watermarked_${file.name}`);
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

    } catch (err: any) {
      console.error('Process error:', err);
      setError(err.message || '处理 PDF 时发生意外错误。');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <ShieldCheck size={24} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Watermarker Pro
            </span>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            支持宋体 (Noto Serif SC)
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {!file ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-gray-300 rounded-3xl p-12 transition-all hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer flex flex-col items-center justify-center min-h-[400px]"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="application/pdf"
                  className="hidden"
                />
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors mb-6">
                  <Upload size={40} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">拖拽或点击上传 PDF</h3>
                <p className="text-gray-500 text-center max-w-sm">
                  文件在浏览器本地处理，绝不上传服务器。支持中文宋体水印。
                </p>
                <button className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                  选择文件
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                      <FileText size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 truncate max-w-[300px]">
                        {file.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="aspect-[3/4] max-w-md mx-auto relative bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex items-center justify-center text-gray-400 group">
                  <div className="absolute inset-0 grid overflow-hidden opacity-50" style={{
                    gridTemplateColumns: `repeat(auto-fill, minmax(${config.spacingX}px, 1fr))`,
                    gridTemplateRows: `repeat(auto-fill, minmax(${config.spacingY}px, 1fr))`,
                    padding: '20px'
                  }}>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-center font-bold pointer-events-none"
                        style={{
                          color: config.color,
                          opacity: config.opacity,
                          transform: `rotate(${config.rotation}deg)`,
                          fontSize: `${config.fontSize / 2.5}px`
                        }}
                      >
                        {config.text || '预览文字'}
                      </div>
                    ))}
                  </div>
                  <div className="relative z-10 text-center p-6 bg-white/40 backdrop-blur-sm rounded-lg border border-white/50">
                    <FileText size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">水印布局预览 (演示)</p>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        {statusMessage || '正在处理...'}
                      </>
                    ) : (
                      <>
                        <Download size={24} />
                        打水印并下载 PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="font-semibold text-sm">操作失败</p>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <SettingsPanel 
              config={config} 
              onChange={setConfig} 
              disabled={isProcessing} 
            />
            
            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white p-6 rounded-3xl shadow-lg">
              <h4 className="font-bold mb-2 flex items-center gap-2 text-blue-200">
                <ShieldCheck size={18} />
                宋体 (SimSun) 支持
              </h4>
              <p className="text-sm text-indigo-100 leading-relaxed">
                当检测到中文字符时，系统会自动加载并嵌入 <strong>Noto Serif SC (思源宋体)</strong>。这是一种专业、清晰的宋体风格字体，确保在所有 PDF 阅读器中完美呈现。
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="mt-20 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Watermarker Pro. 极速、安全、本地化处理.
      </footer>
    </div>
  );
};

export default App;
