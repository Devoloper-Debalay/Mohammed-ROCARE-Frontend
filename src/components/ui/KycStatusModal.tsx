import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";

interface KycStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  verificationStatus?: string;
  profileStatus?: string;
}

export function KycStatusModal({ isOpen, onClose, verificationStatus, profileStatus }: KycStatusModalProps) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const isRejected = verificationStatus === "REJECTED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-200 dark:border-gray-800 text-center">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl mb-4 ${
            isRejected ? "bg-red-100 dark:bg-red-950" : "bg-amber-100 dark:bg-amber-950"
          }`}
        >
          {isRejected ? "⛔" : "⏳"}
        </div>

        <h2 className="text-lg font-black text-gray-900 dark:text-white">
          {isRejected ? "KYC Verification Rejected" : "KYC Under Review"}
        </h2>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {isRejected
            ? "Your KYC documents were rejected by the admin team. Please update your Aadhaar/PAN details and bank information on your profile, then wait for re-verification."
            : "Your account is pending admin approval. Once your KYC and profile are verified, you'll be able to accept leads, purchase parts, and add wallet funds."}
        </p>

        <p className="mt-2 text-[11px] font-mono uppercase tracking-wider text-gray-400">
          Verification: {verificationStatus || "PENDING"} · Profile: {profileStatus || "DRAFT"}
        </p>

        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <Button
            accent="orange"
            onClick={() => {
              onClose();
              navigate("/vendor/profile");
            }}
          >
            Go to Profile &amp; KYC
          </Button>
          <Button variant="secondary" accent="orange" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
