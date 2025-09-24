import { Form, InputGroup, Button } from "react-bootstrap";
import { FaPaperPlane } from "react-icons/fa";

export default function MessageInput({ 
  selectedChat, 
  newMessage, 
  onMessageChange, 
  onSendMessage 
}) {
  if (!selectedChat) return null;

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSendMessage();
    }
  };

  return (
    <div className="bg-white px-4 py-3" style={{ 
      borderTop: '1px solid #eee', 
      position: 'fixed', 
      left: "320px", 
      right: 0, 
      bottom: 0, 
      zIndex: 100 
    }}>
      <InputGroup>
        <Form.Control
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button variant="primary" onClick={onSendMessage}>
          <FaPaperPlane />
        </Button>
      </InputGroup>
    </div>
  );
}