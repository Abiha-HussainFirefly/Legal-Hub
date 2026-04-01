'use client';

import { useState } from 'react';

export default function Settings() {
  const [formData, setFormData] = useState({
    name: 'Admin User',
    email: 'admin@legal-platform.com',
  });

  const [toggles, setToggles] = useState({
    shield1: true,
    shield2: true,
    shield3: true,
  });

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  const handleToggle = (key: string) => {
    setToggles((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  return (
    <div className="bg-[#F9FAFB] rounded-2xl shadow-sm p-4 md:p-6">

      {/* Page Header */}
      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-xs sm:text-sm text-gray-500">Admin profile and system configurations</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-4 sm:mb-8">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Profile Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-4 sm:mt-6 w-full sm:w-auto px-6 py-2 text-sm text-white rounded-full hover:opacity-90 transition-opacity font-medium shadow-md"
          style={{ background: 'linear-gradient(135deg, #4C2F5E 10%, #9F63C4 100%)' }}
        >
          Save Changes
        </button>
      </div>

      {/* System Configuration */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">System Configuration</h2>

        <div className="space-y-0">

          {/* Toggle 1 */}
          <div className="flex items-center justify-between py-3 sm:py-4 border-b border-gray-100 gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-medium text-gray-900">AI Integrity Shield</h3>
              <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Automatically scan content for violations</p>
            </div>
            <button
              onClick={() => handleToggle('shield1')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                toggles.shield1 ? 'bg-[#9F63C4]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  toggles.shield1 ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Toggle 2 */}
          <div className="flex items-center justify-between py-3 sm:py-4 border-b border-gray-100 gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-medium text-gray-900">User Data Encryption</h3>
              <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Force end-to-end encryption on all case files</p>
            </div>
            <button
              onClick={() => handleToggle('shield2')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                toggles.shield2 ? 'bg-[#9F63C4]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  toggles.shield2 ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Toggle 3 */}
          <div className="flex items-center justify-between py-3 sm:py-4 gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-medium text-gray-900">Auto-Moderation</h3>
              <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Instantly hide posts flagged with 95%+ confidence</p>
            </div>
            <button
              onClick={() => handleToggle('shield3')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                toggles.shield3 ? 'bg-[#9F63C4]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  toggles.shield3 ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
