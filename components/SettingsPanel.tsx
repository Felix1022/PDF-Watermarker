
import React from 'react';
import { WatermarkConfig } from '../types';

interface SettingsPanelProps {
  config: WatermarkConfig;
  onChange: (config: WatermarkConfig) => void;
  disabled: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onChange, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({
      ...config,
      [name]: name === 'text' || name === 'color' ? value : parseFloat(value)
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Watermark Settings</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Watermark Text</label>
          <input
            type="text"
            name="text"
            value={config.text}
            onChange={handleChange}
            disabled={disabled}
            placeholder="Confidential / Draft"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Opacity</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Rotation (deg)</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Grid Spacing X</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Grid Spacing Y</label>
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
