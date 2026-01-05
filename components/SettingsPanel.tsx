
import React from 'react';
import { WatermarkConfig } from '../types';

interface SettingsPanelProps {
  config: WatermarkConfig;
  onChange: (config: WatermarkConfig) => void;
  disabled: boolean;
  lang: 'en' | 'zh';
}

const translations = {
  en: {
    title: "Watermark Settings",
    text: "Watermark Text",
    color: "Color",
    opacity: "Opacity",
    fontSize: "Font Size",
    rotation: "Rotation (deg)",
    spacingX: "Grid Spacing X",
    spacingY: "Grid Spacing Y",
    placeholder: "Confidential / Draft"
  },
  zh: {
    title: "水印参数设置",
    text: "水印文字",
    color: "颜色",
    opacity: "不透明度",
    fontSize: "字体大小",
    rotation: "旋转角度 (度)",
    spacingX: "水平网格间距",
    spacingY: "垂直网格间距",
    placeholder: "请输入水印文字"
  }
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onChange, disabled, lang }) => {
  const t = translations[lang];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({
      ...config,
      [name]: name === 'text' || name === 'color' ? value : parseFloat(value)
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t.title}</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.text}</label>
          <input
            type="text"
            name="text"
            value={config.text}
            onChange={handleChange}
            disabled={disabled}
            placeholder={t.placeholder}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.color}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="color"
                value={config.color}
                onChange={handleChange}
                disabled={disabled}
                className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
              />
              <span className="text-xs text-gray-500 font-mono uppercase">{config.color}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.opacity}</label>
            <input
              type="range"
              name="opacity"
              min="0.05"
              max="1"
              step="0.05"
              value={config.opacity}
              onChange={handleChange}
              disabled={disabled}
              className="w-full accent-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.fontSize}</label>
            <input
              type="number"
              name="fontSize"
              min="10"
              max="200"
              value={config.fontSize}
              onChange={handleChange}
              disabled={disabled}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.rotation}</label>
            <input
              type="number"
              name="rotation"
              min="-360"
              max="360"
              value={config.rotation}
              onChange={handleChange}
              disabled={disabled}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.spacingX}</label>
            <input
              type="number"
              name="spacingX"
              min="50"
              max="1000"
              value={config.spacingX}
              onChange={handleChange}
              disabled={disabled}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.spacingY}</label>
            <input
              type="number"
              name="spacingY"
              min="50"
              max="1000"
              value={config.spacingY}
              onChange={handleChange}
              disabled={disabled}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
