import axios from "axios";
const APIURL = "http://localhost:3000";

async function loginUser({ username, password }) {
  try {
    const response = await axios.post(
      `${APIURL}/login`,
      {
        username,
        password,
      },
      { withCredentials: true }
    ); // Include credentials in the request
    return response.data; // Axios automatically parses JSON
  } catch (error) {
    console.error("Error logging in:", error);
    throw error; // Re-throw the error for further handling
  }
}

async function registerUser({ username, name, surname, password }) {
  
  try {
    const response = await axios.post(
      `${APIURL}/users`,
      {
        username,
        name,
        surname,
        password,
      },
      { withCredentials: true }
    ); // Include credentials in the request
    return response.data; // Axios automatically parses JSON
  } catch (error) {
    console.error("Error registering:", error);
    throw error; // Re-throw the error for further handling
  }
}

async function getUserChats() {
  try {
    const response = await axios.get(`${APIURL}/chats`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

async function getUserRequests() {
  try {
    const response = await axios.get(`${APIURL}/requests`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error retrieving user's requests:", error);
    throw error;
  }
}

async function acceptInvitation(chat_id) {
  try {
    const response = await axios.post(
      `${APIURL}/requests/${chat_id}/accept`,
      { chat_id },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error accepting invitation:", error);
    throw error;
  }
}

async function rejectInvitation(chat_id) {
  try {
    const response = await axios.delete(
      `${APIURL}/requests/${chat_id}/delete`,
      { data: { chat_id }, withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting invitation:", error);
    throw error;
  }
}

// Get all messages from a specific chat
async function getChatMessages(chatId) {
  try {
    const response = await axios.get(`${APIURL}/chats/${chatId}/messages`, {
      withCredentials: true,
    });
    return response.data; // Array of messages
  } catch (error) {
    console.error("Error retrieving chat messages:", error);
    throw error;
  }
}

// Send a new message in a chat
async function sendMessage(chatId, msg) {
  try {
    const response = await axios.post(
      `${APIURL}/chats/${chatId}/messages`,
      { msg },
      { withCredentials: true }
    );
    return response.data; // Server response
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

async function logoutUser() {
  try {
    const response = await axios.post(
      `${APIURL}/logout`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
}

async function createPrivateChat(other_username) {
  try {
    const response = await axios.post(
      `${APIURL}/chats`,
      { other_username },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating private chat:", error);
    throw error;
  }
}

async function createGroupChat(name, participants) {
  try {
    const response = await axios.post(
      `${APIURL}/groups`,
      { name, is_group: true, participants },
      { withCredentials: true }
    );
    return response.data; // Server response
  } catch (error) {
    console.error("Error creating group chat:", error);
    throw error;
  }
}

async function inviteUsersToGroup(chat_id, usernames) {
  try {
    const response = await axios.post(
      `${APIURL}/chats/${chat_id}/requests`,
      { to: usernames },
      { withCredentials: true }
    );
    return response.data; // Server response
  } catch (error) {
    console.error("Error inviting users to group:", error);
    throw error;
  }
}

async function leaveGroup(chatId) {
  try {
    const response = await axios.delete(`${APIURL}/chats/${chatId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error leaving group:", error);
    throw error;
  }
}

export {
  loginUser,
  registerUser,
  getUserChats,
  getUserRequests,
  acceptInvitation,
  rejectInvitation,
  sendMessage,
  getChatMessages,
  logoutUser,
  createPrivateChat,
  createGroupChat,
  inviteUsersToGroup,
  leaveGroup,
};
