import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, 
  Users, 
  FolderOpen, 
  Globe, 
  ChevronRight,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Layout },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Portal', href: '/portal', icon: Globe },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="lg:hidden fixed inset-0 bg-gray-600 bg-opacity-75 z-20"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: isOpen ? 200 : 64,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 z-30 h-full bg-white border-r border-gray-200 shadow-lg lg:relative lg:z-0"
      >
        {/* Toggle button positioned on the edge */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-5 z-40 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 shadow-md transition-all hover:bg-blue-700 focus:outline-none"
        >
          <ChevronRight className={`h-5 w-5 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center p-4 border-b border-gray-200 h-16">
            {isOpen && (
              <motion.h1 
                className="text-xl font-bold text-gray-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Admin Portal
              </motion.h1>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="ml-3"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </NavLink>
              );
            })}
          </nav>

    {/* User Profile */}
<div className="border-t border-gray-200 p-4">
  {isOpen ? (
    <>
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {user?.user_metadata?.username || 'Admin'}
          </p>
          <p className="text-xs text-gray-500">Administrator</p>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="w-full justify-start text-gray-700 hover:text-red-700 hover:bg-red-50"
      >
        <LogOut className="h-4 w-4 mr-2" />
        <span>Sign Out</span>
      </Button>
    </>
  ) : (
    <div className="flex flex-col items-center space-y-4">
      <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
        <User className="h-4 w-4 text-white" />
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="text-gray-700 hover:text-red-700 hover:bg-red-50 p-2"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )}
</div>
        </div>
      </motion.div>
    </>
  );
}