import { Button } from "react-bootstrap";
import { FaUser, FaUsers, FaSignOutAlt } from "react-icons/fa";
import { BsInfoCircle } from "react-icons/bs";
import { TiUserAdd } from "react-icons/ti";

export default function ChatHeader({ 
  selectedChatData, 
  onShowInviteModal, 
  onShowGroupInfo, 
  onShowLeaveConfirm 
}) {
  if (!selectedChatData) return null;

  return (
    <div className="bg-primary text-white d-flex justify-content-between align-items-center px-4" 
         style={{ height: 70, flex: '0 0 auto' }}>
      <div className="d-flex align-items-center">
        {selectedChatData?.type === "user" ? (
          <FaUser className="me-2" />
        ) : (
          <FaUsers className="me-2" />
        )}
        <span className="fw-bold">
          {selectedChatData?.name || "Unknown Chat"}
        </span>
      </div>
      {selectedChatData?.type === "group" && (
        <div className="d-flex gap-2">
          <Button
            variant="outline-light"
            size="sm"
            onClick={onShowInviteModal}
            title="Invite users to group"
          >
            <TiUserAdd size={20} />
          </Button>
          <Button
            variant="outline-light"
            size="sm"
            onClick={onShowGroupInfo}
            title="Group information"
          >
            <BsInfoCircle size={18} />
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={onShowLeaveConfirm}
            title="Leave group"
          >
            <FaSignOutAlt size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}