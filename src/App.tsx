import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToasterProvider } from './context/ToasterContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './layouts/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientInformation } from './sections/ClientInformation';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectInformation } from './sections/ProjectInformation';
import { ClientPortalPage } from './pages/ClientPortalPage';


function App() {
  return (
    <Router>
      <AuthProvider>
        <ToasterProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* Client Portal Route - No authentication required */}
            <Route path="/client-portal/:token" element={<ClientPortalPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout/>
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="clients/:id" element={<ClientInformation />} />
              <Route path="projects/:id" element={<ProjectInformation />} />
              <Route index element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </ToasterProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;