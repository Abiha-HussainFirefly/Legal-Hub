'use client';

import { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';

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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />

      <main className="ml-64 pt-20 p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-sm text-gray-500">Admin profile and system configurations</p>
        </div>

        {/* Profile Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            Save Changes
          </button>
        </div>

        {/* System Configuration */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">System Configuration</h2>

          <div className="space-y-6">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-medium text-gray-900">AI Integrity Shield</h3>
                <p className="text-xs text-gray-500 mt-1">Automatically scan content for violations</p>
              </div>
              <button
                onClick={() => handleToggle('shield1')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  toggles.shield1 ? 'bg-purple-600' : 'bg-gray-200'
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
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-medium text-gray-900">AI Integrity Shield</h3>
                <p className="text-xs text-gray-500 mt-1">Automatically scan content for violations</p>
              </div>
              <button
                onClick={() => handleToggle('shield2')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  toggles.shield2 ? 'bg-purple-600' : 'bg-gray-200'
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
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900">AI Integrity Shield</h3>
                <p className="text-xs text-gray-500 mt-1">Automatically scan content for violations</p>
              </div>
              <button
                onClick={() => handleToggle('shield3')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  toggles.shield3 ? 'bg-purple-600' : 'bg-gray-200'
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
      </main>
    </div>
  );
}
