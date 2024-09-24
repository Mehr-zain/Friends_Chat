import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const ProfileCard = ({ user, onClose }) => {
  const [newDisplayName, setNewDisplayName] = useState(user.displayName);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const handleUpdateProfile = async () => {
    try {
      await updateProfile(auth.currentUser, { displayName: newDisplayName });
      await updateDoc(doc(db, "users", user.uid), { displayName: newDisplayName });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <img
          src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
          alt={user.displayName}
          className="w-32 h-32 rounded-full mx-auto mb-4"
        />
        {isEditing ? (
          <div className="mb-4">
            <input
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleUpdateProfile}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 text-center">
            <p className="text-xl font-semibold">{user.displayName}</p>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-500 hover:underline mt-2"
            >
              Edit Name
            </button>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;