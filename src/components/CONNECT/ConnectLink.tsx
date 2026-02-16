"use client";
import { MdLock, MdLockOpen } from "react-icons/md";
import ConnectModal from "./ConnectModal";
import { useQubicConnect } from "./QubicConnectContext";

const ConnectLink: React.FC<{ darkMode?: boolean }> = ({ darkMode }) => {
  const { connected, showConnectModal, toggleConnectModal } = useQubicConnect();

  return (
    <>
      <div
        className="flex cursor-pointer items-center justify-center gap-[10px] p-2 text-white hover:text-green-400"
        onClick={() => toggleConnectModal()}
      >
        {connected ? (
          <>
            <MdLock size={20} />
          </>
        ) : (
          <>
            <MdLockOpen size={20} />
          </>
        )}
      </div>
      <ConnectModal open={showConnectModal} onClose={() => toggleConnectModal(false)} darkMode={darkMode} />
    </>
  );
};

export default ConnectLink;
