import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion  } from "framer-motion";
import {
  Layout,
  Users,
  FolderOpen,
  Globe,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Layout },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Projects", href: "/projects", icon: FolderOpen },

];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Remove the mobile overlay completely since we're using margin approach */}
      
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: isOpen ? 200 : 64,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 z-30 h-full bg-gray-900 border-r border-gray-700 shadow-lg lg:relative lg:z-0"
      >
        {/* Toggle button positioned on the edge */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-5 z-40 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 shadow-md transition-all hover:bg-blue-700 focus:outline-none"
        >
          <ChevronRight
            className={`h-5 w-5 text-white transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-center items-center p-4 border-b border-gray-700 h-16">
            {isOpen ? (
              <motion.h1
                className="text-md font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <span className="text-blue-600 mr-1">CLIENT</span>
                <span className="text-white">MANAGEMENT</span>
              </motion.h1>
            ) : (
              <motion.h1
                className="text-md font-bold flex"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <span className="text-blue-600 mr-1">C</span>
                <span className="text-white">M</span>
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
                      ? "bg-blue-600 text-white border-r-2 border-blue-400"
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
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
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-white truncate">
                    {user?.user_metadata?.username || "Admin"}
                  </p>
                </motion.div>
              )}
            </div>

            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className={`${
                  isOpen ? "w-full justify-start" : "w-8 h-8 p-0 justify-center"
                } text-gray-300 hover:text-red-400 hover:bg-gray-800`}
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="ml-2"
                  >
                    Sign Out
                  </motion.span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}