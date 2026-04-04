"use client";

import { Check, Eye, EyeOff, KeyRound, Pencil, ArrowLeft, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ProfilePageProps {
  user: {
    name: string;
    email: string;
    occupation?: string;
    avatarUrl?: string;
  };
  variant?: "lawyer" | "admin"; 
  onSave?: (data: any) => Promise<any>; 
}

export default function ProfilePage({
  user,
  variant = "admin",
  onSave,
}: ProfilePageProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal and Visibility States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalVisibility, setModalVisibility] = useState({ 
    current: false, 
    new: false, 
    confirm: false 
  });

  const fixedRole = variant === "admin" ? "Admin" : "Lawyer";
  const accent = "#4C2F5E"; // Brand Purple

  const [formData, setFormData] = useState({
    name: user.name,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [displayData, setDisplayData] = useState({
    name: user.name,
  });

  useEffect(() => {
    setFormData((p) => ({ ...p, name: user.name }));
    setDisplayData({ name: user.name });
  }, [user]);

  // Unified save function that can handle both Name and Password updates
  const handleActionSave = async (payload: any) => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(payload);
      }
      if (payload.name) setDisplayData({ name: payload.name });
      
      // Close UI elements on success
      setIsEditing(false);
      setShowPasswordModal(false);
      
      // Clear password fields
      setFormData(p => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update. Please check your connection or current password.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F3F0F4] p-4 sm:p-8 font-sans relative">
      
      <div 
        className="w-full rounded-[24px] p-6 sm:p-10 shadow-sm border border-gray-100 mb-8"
        style={{ backgroundColor: "#F9FAFB" }} 
      >
        <div className="mb-8 flex items-center gap-4">
          {variant === "lawyer" && (
            <button 
              onClick={() => router.push("/discussions")}
              className="p-2 hover:bg-white rounded-full transition-colors text-gray-600 bg-white shadow-sm border border-gray-100"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
            Profile Settings
          </h1>
        </div>

        <div className="bg-white rounded-[20px] shadow-sm overflow-hidden border border-gray-50">
          
          <div className="px-8 py-6 border-b border-gray-100">
            <h2 className="text-[22px] font-bold" style={{ color: accent }}>
              Personal Information
            </h2>
          </div>

          <div className="px-8 py-4 divide-y divide-gray-50">
            {/* Name Row */}
            <div className="flex items-center py-6 gap-8">
              <span className="w-40 shrink-0 text-sm font-semibold text-gray-400 uppercase tracking-wider">Name</span>
              <div className="flex-1">
                {isEditing ? (
                  <div className="relative flex items-center max-w-md">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      className="w-full text-[16px] text-[#1a1a2e] border-b-2 pb-1 focus:outline-none"
                      style={{ borderColor: accent }}
                    />
                    <Pencil size={14} className="absolute right-0 text-gray-300" />
                  </div>
                ) : (
                  <span className="text-[16px] font-bold text-[#1a1a2e]">{displayData.name}</span>
                )}
              </div>
            </div>

            {/* Email Row */}
            <div className="flex items-center py-6 gap-8">
              <span className="w-40 shrink-0 text-sm font-semibold text-gray-400 uppercase tracking-wider">Email</span>
              <span className="text-[16px] text-gray-400">{user.email}</span>
            </div>

            {/* Role Row */}
            <div className="flex items-center py-6 gap-8">
              <span className="w-40 shrink-0 text-sm font-semibold text-gray-400 uppercase tracking-wider">Role</span>
              <span className="text-[16px] text-[#1a1a2e] font-medium">{fixedRole}</span>
            </div>

            {/* Password Row */}
            <div className="flex items-center py-6 gap-8 border-b-0">
              <span className="w-40 shrink-0 text-sm font-semibold text-gray-400 uppercase tracking-wider">Password</span>
              <div className="flex-1 flex items-center gap-4">
                <KeyRound size={18} className="text-gray-400" />
                <span className="text-[16px] text-[#1a1a2e] tracking-[0.4em]">••••••••</span>
                {isEditing && (
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="text-xs font-bold uppercase tracking-tighter hover:underline"
                    style={{ color: accent }}
                  >
                    Update Security
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="px-8 py-6 bg-gray-50/30 flex justify-end gap-4 border-t border-gray-50">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-gray-500 px-6 py-2.5 hover:bg-gray-100 rounded-full transition">
                  Cancel
                </button>
                <button 
                  onClick={() => handleActionSave({ name: formData.name })}
                  className="text-sm font-bold text-white px-8 py-2.5 rounded-full shadow-md transition active:scale-95"
                  style={{ backgroundColor: accent }}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-sm font-bold text-white px-8 py-2.5 rounded-full shadow-md transition active:scale-95"
                style={{ backgroundColor: accent }}
              >
                <Pencil size={14} /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-[#1a1a2e] mb-6">Change Password</h2>
            
            <div className="space-y-5">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Current Password:</label>
                <div className="relative">
                  <input 
                    type={modalVisibility.current ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(p => ({ ...p, currentPassword: e.target.value }))}
                    className="w-full p-3 pr-10 border rounded-xl bg-gray-50/50 focus:outline-none border-gray-200 focus:border-[#4C2F5E]"
                    placeholder="xxxxxxxx"
                  />
                  <button 
                    onClick={() => setModalVisibility(p => ({ ...p, current: !p.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {modalVisibility.current ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">New Password:</label>
                <div className="relative">
                  <input 
                    type={modalVisibility.new ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => setFormData(p => ({ ...p, newPassword: e.target.value }))}
                    className="w-full p-3 pr-10 border rounded-xl bg-gray-50/50 focus:outline-none border-gray-200 focus:border-[#4C2F5E]"
                    placeholder="xxxxxxxx"
                  />
                  <button 
                    onClick={() => setModalVisibility(p => ({ ...p, new: !p.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {modalVisibility.new ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Confirm Password:</label>
                <div className="relative">
                  <input 
                    type={modalVisibility.confirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                    className="w-full p-3 pr-10 border rounded-xl bg-gray-50/50 focus:outline-none border-gray-200 focus:border-[#4C2F5E]"
                    placeholder="xxxxxxxx"
                  />
                  <button 
                    onClick={() => setModalVisibility(p => ({ ...p, confirm: !p.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {modalVisibility.confirm ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                type="button"
                onClick={() => setShowPasswordModal(false)} 
                className="flex-1 py-3 rounded-full border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={isSaving}
                onClick={() => {
                   if (!formData.currentPassword || !formData.newPassword) return alert("Please fill all fields");
                   if (formData.newPassword !== formData.confirmPassword) return alert("New passwords do not match");
                   handleActionSave({ 
                     currentPassword: formData.currentPassword, 
                     newPassword: formData.newPassword 
                   });
                }}
                className="flex-1 py-3 rounded-full text-white font-bold transition active:scale-95 shadow-lg disabled:opacity-50" 
                style={{ backgroundColor: accent }}
              >
                {isSaving ? "Updating..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}