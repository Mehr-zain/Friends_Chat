import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import UserList from './UserList';
import Navbar from './Navbar';
import ProfileCard from './ProfileCard';
import { Menu, X, Loader2, Send } from 'lucide-react';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentChat, setCurrentChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!auth.currentUser || !currentChat) return;

    const chatId = getChatId(auth.currentUser.uid, currentChat.id);
    const chatRef = doc(db, "userChats", chatId);

    const unsubscribe = onSnapshot(
      query(collection(chatRef, "messages"), orderBy("time", "asc")),
      (querySnapshot) => {
        const fetchedMessages = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(fetchedMessages);
      },
      (error) => {
        console.error("Error fetching messages:", error);
      }
    );

    return () => unsubscribe();
  }, [currentChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getChatId = (uid1, uid2) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentChat) return;
  
    setLoading(true);
    try {
      const chatId = getChatId(auth.currentUser.uid, currentChat.id);
      const chatRef = doc(db, "userChats", chatId);
  
      const messageData = {
        text: newMessage,
        senderId: auth.currentUser.uid,
        receiverId: currentChat.id,
        time: serverTimestamp(),
      };
  
      await addDoc(collection(chatRef, "messages"), messageData);
  
      await updateDoc(chatRef, {
        lastMessage: newMessage,
        time: serverTimestamp(),
        participants: [auth.currentUser.uid, currentChat.id]
      });
  
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message: ", error);
    } finally {
      setLoading(false);
    }
  };
  

  const handleSelectUser = async (user) => {
    setCurrentChat(user);
    setShowUserList(false);

    const chatId = getChatId(auth.currentUser.uid, user.id);
    const chatRef = doc(db, "userChats", chatId);

    try {
      const chatDoc = await getDoc(chatRef);
      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          participants: [auth.currentUser.uid, user.id],
          lastMessage: "",
          time: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error creating or fetching chat:", error);
    }
  };

  const handleOpenProfileCard = () => {
    setShowProfileCard(true);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar 
        user={auth.currentUser} 
        currentChat={currentChat} 
        onOpenProfileCard={handleOpenProfileCard}
        onToggleUserList={() => setShowUserList(!showUserList)}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className={`${showUserList ? 'block' : 'hidden'} md:block md:w-1/3 lg:w-1/4 border-r border-gray-200 bg-gray-50 z-10 md:relative absolute inset-y-0 left-0 transform ${showUserList ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition duration-200 ease-in-out`}>
          <UserList 
            onSelectUser={handleSelectUser} 
            selectedUserId={currentChat?.id} 
            onOpenProfileCard={handleOpenProfileCard}
          />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="md:hidden p-2 absolute top-2 right-2 z-20">
            <button
              onClick={() => setShowUserList(!showUserList)}
              className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              {showUserList ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          {currentChat ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === auth.currentUser.uid ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                        message.senderId === auth.currentUser.uid
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-black'
                      }`}
                    >
                      <p className="break-words">{message.text}</p>
                      <p className="text-xs mt-1 opacity-75 text-right">
                        {formatTime(message.time)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={sendMessage} className="flex">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border rounded-l text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className={`bg-blue-500 text-white p-2 rounded-r text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send size={20} />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Select a friend to start messaging</p>
            </div>
          )}
        </div>
      </div>
      {showProfileCard && (
        <ProfileCard user={auth.currentUser} onClose={() => setShowProfileCard(false)} />
      )}
    </div>
  );
};

export default Chat;
