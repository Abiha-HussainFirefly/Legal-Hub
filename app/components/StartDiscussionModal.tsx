'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

interface StartDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StartDiscussionModal({ isOpen, onClose }: StartDiscussionModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    region: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Discussion data:', formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all border-4  border-purple-300">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#9d5ac7]">Start a New Legal Discussion</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#4C2F5E] mb-2">
                Discussion Title<span className="text-[#4C2F5E]">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter a Clear, descriptive title for your legal questions..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#4C2F5E] mb-2">
                  Category<span className="text-[#4C2F5E]">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white cursor-pointer transition"
                  required
                >
                  <option value="">Select category</option>
                  <option value="criminal">Criminal Law</option>
                  <option value="family">Family Law</option>
                  <option value="property">Property Law</option>
                  <option value="corporate">Corporate Law</option>
                  <option value="tax">Tax Law</option>
                  <option value="labor">Labor Law</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4C2F5E] mb-2">
                  Region<span className="text-[#4C2F5E]">*</span>
                </label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white cursor-pointer transition"
                  required
                >
                  <option value="">Select Region</option>
                  <option value="islamabad">Islamabad</option>
                  <option value="karachi">Karachi</option>
                  <option value="lahore">Lahore</option>
                  <option value="punjab">Punjab</option>
                  <option value="sindh">Sindh</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#4C2F5E] mb-2">
                Description<span className="text0[#4C2F5E]">*</span>
              </label>
              <textarea
                placeholder="Describe your legal question or topic detail. Include relevate facts, dates, and any specific concerns..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 border border-[#D9E9E8] rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-[#9F63C4] bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#68427f] text-white rounded-lg hover:bg-purple-700 transition font-medium shadow-lg hover:shadow-xl"
              >
                Post Discussion
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}