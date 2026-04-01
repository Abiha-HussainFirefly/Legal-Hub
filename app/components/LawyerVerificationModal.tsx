"use client";

import { useState } from "react";

export interface LawyerDocument {
  name:       string;
  uploadedOn: string;
}

export interface LawyerData {
  id:         number;
  name:       string;
  barNumber:  string;
  region:     string;
  status:     string;
  submitted:  string;
  documents?: LawyerDocument[];
}

interface LawyerVerificationModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  lawyerData: LawyerData | null;
}

const defaultDocuments: LawyerDocument[] = [
  { name: "Bar Council Card", uploadedOn: "2025-10-21" },
  { name: "CNIC",             uploadedOn: "2025-10-21" },
];

export default function LawyerVerificationModal({
  isOpen,
  onClose,
  lawyerData,
}: LawyerVerificationModalProps) {
  const [notes, setNotes] = useState("");

  if (!isOpen || !lawyerData) return null;

  const documents = lawyerData.documents ?? defaultDocuments;
  const isPending = lawyerData.status === "pending";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
    >
      
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          bg-white w-full relative
          rounded-t-2xl sm:rounded-2xl
          max-h-[92vh] sm:max-h-[90vh]
          overflow-y-auto
          sm:max-w-lg
        "
      >
        {/*  Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-3 sticky top-0 bg-white z-10 border-b border-gray-100">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-200 sm:hidden" />

          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            Lawyer Verification Details
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6"  x2="6"  y2="18" />
              <line x1="6"  y1="6"  x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 pb-6 flex flex-col gap-4 sm:gap-5 mt-4">

          {/* Personal Information */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Personal Information</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-[#6E7D7D] mb-0.5">Name</p>
                <p className="text-sm font-medium text-gray-900">{lawyerData.name}</p>
              </div>
              <div className="text-right sm:text-left">
                <p className="text-xs text-[#6E7D7D] mb-0.5">Bar Number</p>
                <p className="text-sm font-medium text-gray-900">{lawyerData.barNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[#6E7D7D] mb-0.5">Region</p>
                <p className="text-sm font-medium text-gray-900">{lawyerData.region}</p>
              </div>
              <div className="text-right sm:text-left">
                <p className="text-xs text-[#6E7D7D] mb-0.5">Status</p>
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: isPending ? "#EEA62B" : "#16a34a" }}
                >
                  {isPending ? "Pending" : "Verified"}
                </span>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">Document</p>
            <div className="flex flex-col gap-2 sm:gap-3">
              {documents.map((doc, i) => (
                <div key={i} className="border border-gray-200 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 bg-[#F9FAFB]">
                  <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Uploaded on {doc.uploadedOn}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">Admin Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this verification..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-700 bg-[#F9FAFB] resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-gray-300"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl font-medium text-sm text-white transition hover:opacity-90 shadow-sm"
              style={{ backgroundColor: "#9F63C4" }}
            >
              <span className="flex items-center justify-center rounded-full w-5 h-5 border border-white">
                <img
                  src="/icons/circletick.png"
                  alt="Approve"
                  className="w-2.5 h-2.5 object-contain brightness-0 invert"
                />
              </span>
              Approve
            </button>

            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl font-medium text-sm text-white transition hover:opacity-90"
              style={{ backgroundColor: "#4C2F5E" }}
            >
              <span
                className="flex items-center justify-center rounded-full w-5 h-5"
                style={{ border: "1.5px solid rgba(255,255,255,0.6)" }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2">
                  <line x1="2" y1="2" x2="10" y2="10" />
                  <line x1="10" y1="2" x2="2"  y2="10" />
                </svg>
              </span>
              Reject
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
