
import React, { useState, useRef, useMemo } from 'react';
import { Upload, FileText, X, Download, ShieldCheck, Loader2, AlertCircle, Languages } from 'lucide-react';
import { WatermarkConfig, PDFFile } from './types';
import { applyWatermark } from './services/pdfService';
import SettingsPanel from './components/SettingsPanel';

type Language = 'en' | 'zh';

const translations = {
  en: {
    title: "Watermarker Pro",
    wysiwyg: "WYSIWYG Mode",
    uploadTitle: "Drop or click to upload PDF",
    uploadDesc: "Chinese Songti supported. Processing is done locally in your browser.",
    selectBtn: "Select File",
    watermarkSettings: "Watermark Settings",
    textLabel: "Watermark Text",
    colorLabel: "Color",
    opacityLabel: "Opacity",
    fontSizeLabel: "Font Size",
    rotationLabel: "Rotation (deg)",
    spacingXLabel: "Grid Spacing X",
    spacingYLabel: "Grid Spacing Y",
    processBtn: "Save Watermarked PDF",
    processing: "Processing...",
    securityTitle: "Security Note",
    securityDesc: "Files are processed locally. No data is uploaded to any server. WYSIWYG preview.",
    previewLabel: "Page Preview (1:1 Alignment)",
    errorTitle: "Operation Failed",
    preparing: "Preparing...",
    generating: "Generating download...",
    defaultText: "Confidential"
  },
  zh: {
    title: "PDF 水印助手",
    wysiwyg: "所见即所得模式",
    uploadTitle: "拖拽或点击上传 PDF",
    uploadDesc: "支持思源宋体。所有处理均在本地完成，确保隐私安全。",
    selectBtn: "选择文件",
    watermarkSettings: "水印设置",
    textLabel: "水印文字",
    colorLabel: "颜色",
    opacityLabel: "不透明度",
    fontSizeLabel: "字体大小",
    rotationLabel: "旋转角度",
    spacingXLabel: "水平间距",
    spacingYLabel: "垂直间距",
    processBtn: "保存并下载 PDF",
    processing: "正在处理...",
    securityTitle: "安全提示",
    securityDesc: "文件本地处理，不上传服务器。预览效果与最终文件 100% 一致。",
    previewLabel: "页面预览 (1:1 坐标对齐)",
    errorTitle: "操作失败",
    preparing: "准备中...",
    generating: "正在生成下载...",
    defaultText: "机密文件"
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  const [file, setFile] = useState<PDFFile | null>(null);
  const [config, setConfig] = useState<WatermarkConfig>({
    text: t.defaultText,
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

  const PDF_WIDTH = 595;
  const PDF_HEIGHT = 842;

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'zh' : 'en';
    setLang(newLang);
    // Also update default text if it hasn't been changed
    if (config.text === translations[lang].defaultText) {
      setConfig(prev => ({ ...prev, text: translations[newLang].defaultText }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError(lang === 'en' ? 'Please upload a valid PDF.' : '请上传有效的 PDF 文件。');
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
        setError(lang === 'en' ? 'Please upload a valid PDF.' : '请上传有效的 PDF 文件。');
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
    setStatusMessage(t.preparing);
    try {
      const arrayBuffer = await file.file.arrayBuffer();
      const watermarkedPdf = await applyWatermark(arrayBuffer, config, (status) => {
        setStatusMessage(status);
      });
      setStatusMessage(t.generating);
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
      setError(err.message || (lang === 'en' ? 'An unexpected error occurred.' : '发生意外错误。'));
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const previewWatermarks = useMemo(() => {
    const marks = [];
    const width = PDF_WIDTH;
    const height = PDF_HEIGHT;
    const diagonal = Math.sqrt(width * width + height * height);
    const stepX = Math.max(config.spacingX, 20);
    const stepY = Math.max(config.spacingY, 20);
    const startX = -diagonal / 2;
    const endX = width + diagonal / 2;
    const startY = -diagonal / 2;
    const endY = height + diagonal / 2;
    for (let x = startX; x < endX; x += stepX) {
      for (let y = startY; y < endY; y += stepY) {
        marks.push({ x, y });
      }
    }
    return marks;
  }, [config.spacingX, config.spacingY]);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <ShieldCheck size={24} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              {t.title}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-xs text-gray-400 font-medium uppercase tracking-wider">
              {t.wysiwyg}
            </div>
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-600"
            >
              <Languages size={16} />
              {lang === 'en' ? '中文' : 'English'}
            </button>
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
                className="group relative border-2 border-dashed border-gray-300 rounded-3xl p-12 transition-all hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer flex flex-col items-center justify-center min-h-[500px]"
              >
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="application/pdf" className="hidden" />
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors mb-6">
                  <Upload size={40} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.uploadTitle}</h3>
                <p className="text-gray-500 text-center max-w-sm">{t.uploadDesc}</p>
                <button className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                  {t.selectBtn}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-xl flex items-center justify-center"><FileText size={32} /></div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 truncate max-w-[300px]">{file.name}</h3>
                      <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button onClick={clearFile} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="relative mx-auto bg-white shadow-2xl border border-gray-200 overflow-hidden" 
                     style={{ width: '100%', maxWidth: '500px', aspectRatio: `${PDF_WIDTH} / ${PDF_HEIGHT}` }}>
                  <div className="absolute inset-0 pointer-events-none origin-top-left" 
                       style={{ width: `${PDF_WIDTH}px`, height: `${PDF_HEIGHT}px`, transform: `scale(${500 / PDF_WIDTH})`, transformOrigin: 'top left' }}>
                    {previewWatermarks.map((mark, i) => (
                      <div
                        key={i}
                        className="absolute whitespace-nowrap"
                        style={{
                          left: `${mark.x}px`,
                          top: `${PDF_HEIGHT - mark.y}px`,
                          color: config.color,
                          opacity: config.opacity,
                          fontSize: `${config.fontSize}px`,
                          transform: `rotate(${-config.rotation}deg)`,
                          transformOrigin: 'left bottom',
                          fontFamily: "'Inter', sans-serif"
                        }}
                      >
                        {config.text || 'Preview'}
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-gray-100 shadow-sm text-xs font-bold text-gray-400">
                      {t.previewLabel}
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? <><Loader2 className="animate-spin" size={24} />{statusMessage || t.processing}</> : <><Download size={24} />{t.processBtn}</>}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <div><p className="font-semibold text-sm">{t.errorTitle}</p><p className="text-sm opacity-90">{error}</p></div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <SettingsPanel config={config} onChange={setConfig} disabled={isProcessing} lang={lang} />
            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white p-6 rounded-3xl shadow-lg">
              <h4 className="font-bold mb-2 flex items-center gap-2 text-blue-200"><ShieldCheck size={18} />{t.securityTitle}</h4>
              <p className="text-sm text-indigo-100 leading-relaxed">{t.securityDesc}</p>
            </div>
          </div>
        </div>
      </main>
      <footer className="mt-20 text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Watermarker Pro. Local, Secure, Fast.
      </footer>
    </div>
  );
};

export default App;
