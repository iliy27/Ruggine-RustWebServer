import { Card, Spinner } from "react-bootstrap";
import { format, isToday, isYesterday, isSameDay, parseISO } from "date-fns";
import logo from "../assets/logo.png";
import { useRef, useEffect, useState } from "react";
import { FaArrowDown } from "react-icons/fa";

export default function MessageList({ 
  selectedChat, 
  messages, 
  loadingMessages, 
  scrollContainerRef
}) {
  const bottomRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const msgs = messages[selectedChat] || [];

  // Show scroll button only if not near bottom
  useEffect(() => {
    if (scrollContainerRef && scrollContainerRef.current) {
      const handleScroll = () => {
        const el = scrollContainerRef.current;
        // Show button only if not near bottom
        setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 150);
      };
      
      const element = scrollContainerRef.current;
      element.addEventListener("scroll", handleScroll);
      // Check immediately
      handleScroll();
      
      return () => {
        if (element) {
          element.removeEventListener("scroll", handleScroll);
        }
      };
    }
  }, [scrollContainerRef, msgs.length, selectedChat]);

  const handleScrollToBottom = () => {
    if (scrollContainerRef && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (
      scrollContainerRef &&
      scrollContainerRef.current &&
      bottomRef.current
    ) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [selectedChat, msgs.length, scrollContainerRef]);

  if (!selectedChat) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center h-100">
        <img src={logo} alt="Logo" style={{ maxHeight: 120 }} />
        <h4 className="text-secondary">Select a chat to start</h4>
      </div>
    );
  }

  if (loadingMessages) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const renderMessages = () => {
    const rendered = [];
    let lastDate = null;
    const msgs = messages[selectedChat] || [];
    
    msgs.forEach((msg, idx) => {
      const msgDate = parseISO(msg.send_at);
      if (!lastDate || !isSameDay(msgDate, lastDate)) {
        let label;
        if (isToday(msgDate)) label = "Today";
        else if (isYesterday(msgDate)) label = "Yesterday";
        else label = format(msgDate, "EEEE, dd/MM/yyyy");
        
        rendered.push(
          <div
            key={`day-separator-${idx}`}
            className="text-center my-3"
          >
            <span className="px-3 py-1 rounded bg-secondary text-white small">
              {label}
            </span>
          </div>
        );
        lastDate = msgDate;
      }
      
      if (msg.is_auto) {
        rendered.push(
          <div
            key={`auto-message-${idx}`}
            className="d-flex justify-content-center mb-3"
          >
            <div
              className="rounded border"
              style={{
                width: "30rem",
                padding: "8px 12px",
                background: "#e2ffc7",
                fontStyle: "italic",
                color: "#2e7d32",
                position: "relative"
              }}
            >
              <span style={{ position: "absolute", left: 8, top: 8 }}>
                <svg width="18" height="18" fill="#388e3c" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
              </span>
              <span style={{ marginLeft: 24 }}>{msg.text}</span>
              <div className="text-end text-muted small mt-1">
                {format(msgDate, "HH:mm")}
              </div>
            </div>
          </div>
        );
      } else {
        rendered.push(
          <div
            key={`message-${idx}`}
            className={`d-flex mb-3 ${
              msg.sender === "me"
                ? "justify-content-end"
                : "justify-content-start"
            }`}
          >
            <div
              className={`rounded ${
                msg.sender === "me"
                  ? "bg-primary text-white"
                  : "bg-white border"
              }`}
              style={{ width: "15rem", padding: "8px 12px" }}
            >
              <span style={{ fontWeight: "bold" }}>
                {msg.sender === "me" ? "You" : msg.sender}
              </span>
              <br />
              {msg.text}
              <div className="text-end text-muted small mt-1">
                {format(msgDate, "HH:mm")}
              </div>
            </div>
          </div>
        );
      }
    });
    
    if (rendered.length) {
      rendered.push(<div key="spacer" style={{ height: "135px" }} />);
      rendered.push(<div ref={bottomRef} key="bottom" />);
      return rendered;
    } else {
      return <div className="text-center text-muted">No messages yet</div>;
    }
  };

  return (
    <Card.Body className="px-0 py-3" style={{ 
      minHeight: 0, 
      background: 'transparent', 
      height: '100%',
      position: 'relative'
    }}>
      {renderMessages()}
      {showScrollBtn && (
        <button
          onClick={handleScrollToBottom}
          style={{
            position: "fixed",
            right: 32,
            bottom: 100,
            zIndex: 200,
            background: "#25d366",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: 48,
            height: 48,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            cursor: "pointer",
            transition: "opacity 0.2s"
          }}
          aria-label="Scroll to bottom"
        >
          <FaArrowDown />
        </button>
      )}
    </Card.Body>
  );
}