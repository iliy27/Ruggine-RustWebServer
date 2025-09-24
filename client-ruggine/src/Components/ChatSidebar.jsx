import { ListGroup, Button } from "react-bootstrap";
import { FaPlus, FaPen, FaUser, FaUsers } from "react-icons/fa";
import logo from "../assets/logo.png";

export default function ChatSidebar({ 
  chats, 
  selectedChat, 
  username, 
  unreadCounts, 
  onChatSelect, 
  onShowNewModal 
}) {
  return (
    <div style={{ 
      width: '320px', 
      minWidth: '220px', 
      maxWidth: '400px', 
      background: '#fff', 
      borderRight: '1px solid #eee', 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      overflow: 'hidden', 
      position: 'relative' 
    }}>
      {/* Logo and username */}
      <div className="text-center py-3 border-bottom" style={{ background: '#fff' }}>
        <img src={logo} alt="Logo" style={{ maxHeight: 60 }} />
        <h5 className="fw-bold mt-2 mb-0">{username}</h5>
      </div>
      
      {/* Chat list */}
      <div
        className="sidebar-chat-list"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: '150px'
        }}
      >
        <ListGroup variant="flush">
          {chats.length > 0 ? (
            chats.map((chat) => (
              <ListGroup.Item
                key={`chat-${chat.id}`}
                action
                active={selectedChat === chat.id}
                onClick={() => onChatSelect(chat.id)}
                className="d-flex align-items-center position-relative"
                style={{ cursor: "pointer", padding: "1rem" }}
              >
                {chat.type === "user" ? (
                  <FaUser className="me-2 text-black" />
                ) : (
                  <FaUsers className="me-2 text-success" />
                )}
                <span>{chat.name || "Private chat"}</span>
                {unreadCounts[chat.id] > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      right: 18,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "#25d366",
                      color: "white",
                      borderRadius: "50%",
                      minWidth: 22,
                      height: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: "bold",
                      boxShadow: "0 0 2px #888",
                      zIndex: 2,
                    }}
                  >
                    {unreadCounts[chat.id]}
                  </span>
                )}
              </ListGroup.Item>
            ))
          ) : (
            <ListGroup.Item className="text-center text-muted">
              No chats available
            </ListGroup.Item>
          )}
        </ListGroup>
      </div>
      
      {/* Pensil button */}
      <div style={{ 
        background: "#fff", 
        borderTop: "1px solid #eee", 
        borderRight: "1px solid #eee", 
        width: "320px", 
        padding: "7px 0", 
        textAlign: "center", 
        position: 'fixed', 
        left: 0, 
        bottom: "1px", 
        zIndex: 100 
      }}>
        <Button
          variant="primary"
          size="lg"
          className="rounded-circle shadow"
          style={{ width: 54, height: 54 }}
          onClick={onShowNewModal}
        >
          <FaPen size={22} />
        </Button>
      </div>
    </div>
  );
}