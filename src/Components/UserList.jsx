import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { UserPlus, Check, X, Loader2, Search } from "lucide-react";
import { toast } from "react-hot-toast";

const UserList = ({ onSelectUser, selectedUserId }) => {
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const unsubscribeUser = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            fetchUsers(userData);
          }
        });

        return () => unsubscribeUser();
      } else {
        setFriends([]);
        setPendingRequests([]);
        setOutgoingRequests([]);
        setUsers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUsers = async (userData) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("No user logged in");
        return;
      }

      const friendIds = userData.friends || [];
      const pendingIds = userData.pendingRequests || [];
      const outgoingIds = userData.outgoingRequests || [];

      const usersQuery = query(
        collection(db, "users"),
        where("__name__", "!=", currentUser.uid)
      );

      const unsubscribeUsers = onSnapshot(usersQuery, async (snapshot) => {
        const allUsers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const friendsList = await Promise.all(
          allUsers
            .filter((user) => friendIds.includes(user.id))
            .map(async (user) => {
              const lastMessage = await getLastMessage(currentUser.uid, user.id);
              return { ...user, lastMessage };
            })
        );

        const pendingList = allUsers.filter((user) =>
          pendingIds.includes(user.id)
        );
        const outgoingList = allUsers.filter((user) =>
          outgoingIds.includes(user.id)
        );
        const suggestionsList = allUsers.filter(
          (user) =>
            !friendIds.includes(user.id) &&
            !pendingIds.includes(user.id) &&
            !outgoingIds.includes(user.id)
        );

        setFriends(friendsList);
        setPendingRequests(pendingList);
        setOutgoingRequests(outgoingList);
        setUsers(suggestionsList);
      });

      return () => unsubscribeUsers();
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users. Please try again.");
    }
  };

  const getLastMessage = async (userId1, userId2) => {
    try {
      const chatId = getChatId(userId1, userId2);
      const chatRef = doc(db, "userChats", chatId);
      const chatDoc = await getDoc(chatRef);

      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        return {
          text: chatData.lastMessage || "No messages yet",
          time: chatData.time ? formatTime(chatData.time.toDate()) : "",
        };
      }
      return { text: "No messages yet", time: "" };
    } catch (error) {
      console.error("Error fetching last message:", error);
      return { text: "Error fetching message", time: "" };
    }
  };

  const getChatId = (uid1, uid2) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  const handleRequestCancel = async (userId) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const currentUser = auth.currentUser;
      const currentUserRef = doc(db, "users", currentUser.uid);
      const friendRef = doc(db, "users", userId);

      await updateDoc(currentUserRef, {
        outgoingRequests: arrayRemove(userId),
      });

      await updateDoc(friendRef, {
        pendingRequests: arrayRemove(currentUser.uid),
      });

      toast.success("Friend request canceled");
    } catch (error) {
      console.error("Error canceling friend request:", error);
      toast.error("Failed to cancel friend request. Please try again.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return "Just now";
    }
  };

  const handleAddFriend = async (userId) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const currentUser = auth.currentUser;
      const currentUserRef = doc(db, "users", currentUser.uid);
      const friendRef = doc(db, "users", userId);

      await updateDoc(currentUserRef, {
        outgoingRequests: arrayUnion(userId),
      });

      await updateDoc(friendRef, {
        pendingRequests: arrayUnion(currentUser.uid),
      });

      toast.success("Friend request sent successfully");
    } catch (error) {
      console.error("Error adding friend:", error);
      toast.error("Failed to add friend. Please try again.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleAcceptRequest = async (userId) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const currentUser = auth.currentUser;
      const currentUserRef = doc(db, "users", currentUser.uid);
      const friendRef = doc(db, "users", userId);

      await updateDoc(currentUserRef, {
        friends: arrayUnion(userId),
        pendingRequests: arrayRemove(userId),
      });

      await updateDoc(friendRef, {
        friends: arrayUnion(currentUser.uid),
        outgoingRequests: arrayRemove(currentUser.uid),
      });

      toast.success("Friend request accepted");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request. Please try again.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeclineRequest = async (userId) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const currentUser = auth.currentUser;
      const currentUserRef = doc(db, "users", currentUser.uid);
      const friendRef = doc(db, "users", userId);

      await updateDoc(currentUserRef, {
        pendingRequests: arrayRemove(userId),
      });

      await updateDoc(friendRef, {
        outgoingRequests: arrayRemove(currentUser.uid),
      });

      toast.success("Friend request declined");
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast.error("Failed to decline friend request. Please try again.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const filteredFriends = friends.filter((user) =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter((user) =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOutgoingRequests = outgoingRequests.filter((user) =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Chats</h2>
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search users..."
          className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
      </div>
      <div className="overflow-y-auto flex-grow space-y-4">
        {pendingRequests.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-2">Requests Received</h3>
            <ul className="space-y-2">
              {pendingRequests.map((user) => (
                <li
                  key={user.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between transition-all hover:shadow-md"
                >
                  <div className="flex items-center">
                    <img
                      className="h-12 w-12 rounded-full object-cover mr-4"
                      src={
                        user.photoURL ||
                        `https://ui-avatars.com/api/?name=${user.displayName}&background=random`
                      }
                      alt={user.displayName}
                    />
                    <span className="font-medium text-lg">
                      {user.displayName}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {actionLoading[user.id] ? (
                      <Loader2 className="animate-spin text-blue-500" />
                    ) : (
                      <>
                        <button
                          className="text-green-500 hover:text-green-600 transition-all"
                          onClick={() => handleAcceptRequest(user.id)}
                        >
                          <Check size={24} />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-600 transition-all"
                          onClick={() => handleDeclineRequest(user.id)}
                        >
                          <X size={24} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {filteredFriends.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-2">Friends</h3>
            <ul className="space-y-2">
              {filteredFriends.map((user) => (
                <li
                  key={user.id}
                  className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between transition-all hover:shadow-md cursor-pointer ${
                    selectedUserId === user.id ? "bg-blue-100" : ""
                  }`}
                  onClick={() => onSelectUser(user)}
                >
                  <div className="flex items-center">
                    <img
                      className="h-12 w-12 rounded-full object-cover mr-4"
                      src={
                        user.photoURL ||
                        `https://ui-avatars.com/api/?name=${user.displayName}&background=random`
                      }
                      alt={user.displayName}
                    />
                    <div>
                      <span className="font-medium text-lg">
                        {user.displayName}
                      </span>
                      {user.lastMessage && (
                        <div className="text-sm text-gray-500">
                          <p className="truncate w-40">
                            {user.lastMessage.text}
                          </p>
                          <span>{user.lastMessage.time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {filteredOutgoingRequests.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-2">Requests Sent</h3>
            <ul className="space-y-2">
              {filteredOutgoingRequests.map((user) => (
                <li
                  key={user.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between transition-all hover:shadow-md"
                >
                  <div className="flex items-center">
                    <img
                      className="h-12 w-12 rounded-full object-cover mr-4"
                      src={
                        user.photoURL ||
                        `https://ui-avatars.com/api/?name=${user.displayName}&background=random`
                      }
                      alt={user.displayName}
                    />
                    <span className="font-medium text-lg">
                      {user.displayName}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {actionLoading[user.id] ? (
                      <Loader2 className="animate-spin text-blue-500" />
                    ) : (
                      <button
                        className="text-red-500 hover:text-red-600 transition-all"
                        onClick={() => handleRequestCancel(user.id)}
                      >
                        <X size={24} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {filteredUsers.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-2">Suggestions</h3>
            <ul className="space-y-2">
              {filteredUsers.map((user) => (
                <li
                  key={user.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between transition-all hover:shadow-md"
                >
                  <div className="flex items-center">
                    <img
                      className="h-12 w-12 rounded-full object-cover mr-4"
                      src={
                        user.photoURL ||
                        `https://ui-avatars.com/api/?name=${user.displayName}&background=random`
                      }
                      alt={user.displayName}
                    />
                    <span className="font-medium text-lg">
                      {user.displayName}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {actionLoading[user.id] ? (
                      <Loader2 className="animate-spin text-blue-500" />
                    ) : (
                      <button
                        className="text-blue-500 hover:text-blue-600 transition-all"
                        onClick={() => handleAddFriend(user.id)}
                      >
                        <UserPlus size={24} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;