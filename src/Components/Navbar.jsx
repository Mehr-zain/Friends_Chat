import React from 'react';
import { Menu } from 'lucide-react';

const Navbar = ({ user, currentChat, onOpenProfileCard, onToggleUserList }) => {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {currentChat ? (
              <div className="flex items-center">
                <img
                  className="h-8 w-8 rounded-full mr-2"
                  src={currentChat.photoURL || `https://ui-avatars.com/api/?name=${currentChat.displayName}&background=random`}
                  alt={currentChat.displayName}
                />
                <span className="font-semibold text-gray-900">{currentChat.displayName}</span>
              </div>
            ) : (
              <div 
                className="flex-shrink-0 flex items-center cursor-pointer"
                onClick={onOpenProfileCard}
              >
                <img
                  className="h-8 w-8 rounded-full mr-2"
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
                  alt={user.displayName}
                />
                <span className="font-semibold text-gray-900">{user.displayName}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            <button
              onClick={onToggleUserList}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Open user list</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;