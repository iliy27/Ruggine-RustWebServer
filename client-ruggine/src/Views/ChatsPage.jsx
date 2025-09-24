import { useState, useEffect, useCallback, useRef } from "react";
import { Container } from "react-bootstrap";
import {
  getUserChats,
  getChatMessages,
  sendMessage,
  inviteUsersToGroup,
  leaveGroup,
} from "../API";
import InviteModal from "../Components/InviteModal";
import ChatSidebar from "../Components/ChatSidebar";
import ChatHeader from "../Components/ChatHeader";
import MessageList from "../Components/MessageList";
import MessageInput from "../Components/MessageInput";
import GroupInfoModal from "../Components/GroupInfoModal";
import InviteUsersModal from "../Components/InviteUsersModal";
import LeaveGroupModal from "../Components/LeaveGroupModal";

export default function ChatsPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteUsernames, setInviteUsernames] = useState([]);
  const [inviteAlert, setInviteAlert] = useState({
    show: false,
    message: "",
    variant: "success",
  });
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({}); // { chatId: count }
  const wsRef = useRef(null);
  const [chats, setChats] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const username = localStorage.getItem("username");
  const messageScrollRef = useRef(null);

  // Function to refresh chats
  const fetchChats = useCallback(async () => {
    if (!username) return;
    try {
      const data = await getUserChats();
      const parsedChats = data
        .filter((chat) => chat.id !== undefined && chat.id !== null)
        .map((chat) => ({
          id: chat.id,
          name: chat.is_group
            ? chat.name
            : (chat.participants && chat.participants[0]) || "No name",
          type: chat.is_group ? "group" : "user",
          is_group: chat.is_group,
          created_at: chat.created_at,
          participants: chat.participants || [],
        }));
      setChats(parsedChats);
    } catch (err) {
      console.error("Error fetching chats:", err);
      setChats([]);
    }
  }, [username]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Check if should refresh chats when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        !document.hidden &&
        localStorage.getItem("shouldRefreshChats") === "true"
      ) {
        localStorage.removeItem("shouldRefreshChats");
        fetchChats();
      }
    };

    const handleFocus = () => {
      if (localStorage.getItem("shouldRefreshChats") === "true") {
        localStorage.removeItem("shouldRefreshChats");
        fetchChats();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchChats]);

  useEffect(() => {
    async function fetchMessages() {
      if (selectedChat == null) return;
      setLoadingMessages(true);
      try {
        const msgs = await getChatMessages(selectedChat);
        setMessages((prev) => ({
          ...prev,
          [selectedChat]: msgs.map((m) => ({
            sender: m.from_user === username ? "me" : m.from_user,
            text: m.msg,
            send_at: m.send_at ? new Date(m.send_at).toISOString() : m.send_at,
            is_auto: m.is_auto ?? false,
          })),
        }));
      } catch (err) {
        console.error("Error fetching messages:", err);
        setMessages((prev) => ({ ...prev, [selectedChat]: [] }));
      } finally {
        setLoadingMessages(false);
      }
    }
    fetchMessages();
  }, [selectedChat, username]);

  // WebSocket
  useEffect(() => {
    // Open connection only if authenticated
    if (!username) return;
    wsRef.current = new window.WebSocket("ws://localhost:3000/ws");
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const chatId = data.chat_id;
        // If it's an auto-generated message, update chats
        // All messages (including is_auto) increment the counter if the chat is not selected
        fetchChats();
        if (selectedChat === chatId) {
          setMessages((prev) => ({
            ...prev,
            [chatId]: prev[chatId]
              ? [
                  ...prev[chatId],
                  {
                    sender: data.from_user === username ? "me" : data.from_user,
                    text: data.msg,
                    send_at: data.send_at,
                    is_auto: !!data.is_auto,
                  },
                ]
              : [
                  {
                    sender: data.from_user === username ? "me" : data.from_user,
                    text: data.msg,
                    send_at: data.send_at,
                    is_auto: !!data.is_auto,
                  },
                ],
          }));
        } else {
          setUnreadCounts((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || 0) + 1,
          }));
        }
      } catch (e) {}
    };
    return () => {
      wsRef.current && wsRef.current.close();
    };
  }, [selectedChat, username]);

  // Function to send messages via WebSocket
  const sendRealtimeMessage = (msgObj) => {
    if (wsRef.current && wsRef.current.readyState === window.WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msgObj));
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;
    sendRealtimeMessage({
      chat_id: selectedChat,
      from_user: username,
      msg: newMessage,
      send_at: null,
    });
    setNewMessage("");
  };

  const handleChatSelect = (chatId) => {
    setSelectedChat(chatId);
    setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 })); // reset unread
  };

  // Reset notifications also when the chat is programmatically selected
  useEffect(() => {
    if (selectedChat != null) {
      setUnreadCounts((prev) => ({ ...prev, [selectedChat]: 0 }));
    }
  }, [selectedChat]);

  const handleShowGroupInfo = () => setShowGroupInfoModal(true);

  const handleShowInviteModal = () => {
    setShowInviteModal(true);
    setInviteUsernames([]);
    setInviteUsername("");
    setInviteAlert({ show: false, message: "", variant: "success" });
  };

  const handleAddInviteUsername = () => {
    if (
      inviteUsername.trim() &&
      !inviteUsernames.includes(inviteUsername.trim())
    ) {
      setInviteUsernames([...inviteUsernames, inviteUsername.trim()]);
      setInviteUsername("");
    } else if (inviteUsernames.includes(inviteUsername.trim())) {
      setInviteAlert({
        show: true,
        message: "Username already added",
        variant: "warning",
      });
    }
  };

  const handleRemoveInviteUsername = (u) =>
    setInviteUsernames(inviteUsernames.filter((name) => name !== u));

  const handleInviteUsers = async () => {
    if (inviteUsernames.length === 0) {
      setInviteAlert({
        show: true,
        message: "Please add at least one username",
        variant: "danger",
      });
      return;
    }
    try {
      let result = await inviteUsersToGroup(selectedChat, inviteUsernames);
      setInviteAlert({
        show: true,
        message: result.message,
        variant: "success",
      });
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteUsernames([]);
        setInviteUsername("");
        setInviteAlert({ show: false, message: "", variant: "success" });
      }, 2000);
    } catch (error) {
      let errorMessage;
      if (error.response?.status === 404) {
        errorMessage = "One or more users not found. Please check the usernames.";
      } else {
        errorMessage = error.response?.data?.message ||
                      error.message ||
                      "Error inviting users. Please try again.";
      }
      
      setInviteAlert({
        show: true,
        message: errorMessage,
        variant: "danger",
      });
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup(selectedChat);
      setShowLeaveConfirm(false);
      setSelectedChat(null);
      fetchChats();
    } catch (error) {
      setShowLeaveConfirm(false);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         "Error leaving group";
      alert(errorMessage);
    }
  };

  const selectedChatData = chats.find((c) => c.id === selectedChat);

  useEffect(() => {
    // If there is a chat selected from a request, select it
    const selectedChatId = localStorage.getItem("selectedChatId");
    if (selectedChatId && chats.some((c) => c.id === Number(selectedChatId))) {
      setSelectedChat(Number(selectedChatId));
      localStorage.removeItem("selectedChatId");
    }
  }, [chats]);

  return (
    <Container
      fluid
      className="min-vh-100 bg-light p-0"
      style={{ height: "100vh", overflow: "hidden", maxHeight: "100vh" }}
    >
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          maxHeight: "100vh",
        }}
      >
        {/* Sidebar */}
        <ChatSidebar
          chats={chats}
          selectedChat={selectedChat}
          username={username}
          unreadCounts={unreadCounts}
          onChatSelect={handleChatSelect}
          onShowNewModal={() => setShowNewModal(true)}
        />

        {/* Chat section */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            background: "#f8f9fa",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Header chat */}
          <ChatHeader
            selectedChatData={selectedChatData}
            onShowInviteModal={handleShowInviteModal}
            onShowGroupInfo={handleShowGroupInfo}
            onShowLeaveConfirm={() => setShowLeaveConfirm(true)}
          />

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              padding: "0 32px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="message-list-scroll"
              ref={messageScrollRef}
              style={{ flex: 1, overflow: "auto", paddingBottom: "120px" }}
            >
              <MessageList
                selectedChat={selectedChat}
                messages={messages}
                loadingMessages={loadingMessages}
                username={username}
                scrollContainerRef={messageScrollRef}
              />
            </div>
          </div>

          {/* Footer send message */}
          <MessageInput
            selectedChat={selectedChat}
            newMessage={newMessage}
            onMessageChange={setNewMessage}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>

      {/* Modals */}
      <InviteModal
        show={showNewModal}
        onHide={() => setShowNewModal(false)}
        onChatCreated={(chatId) => {
          if (chatId) {
            setSelectedChat(chatId);
            fetchChats();
          } else {
            fetchChats();
          }
        }}
      />

      <GroupInfoModal
        show={showGroupInfoModal}
        onHide={() => setShowGroupInfoModal(false)}
        selectedChatData={selectedChatData}
        username={username}
      />

      <InviteUsersModal
        show={showInviteModal}
        onHide={() => setShowInviteModal(false)}
        inviteUsername={inviteUsername}
        inviteUsernames={inviteUsernames}
        inviteAlert={inviteAlert}
        onInviteUsernameChange={setInviteUsername}
        onAddInviteUsername={handleAddInviteUsername}
        onRemoveInviteUsername={handleRemoveInviteUsername}
        onInviteUsers={handleInviteUsers}
        onAlertClose={() => setInviteAlert({ ...inviteAlert, show: false })}
      />

      <LeaveGroupModal
        show={showLeaveConfirm}
        onHide={() => setShowLeaveConfirm(false)}
        onLeaveGroup={handleLeaveGroup}
      />
    </Container>
  );
}
