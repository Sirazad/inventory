import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Characters from './pages/Characters';
import InventoryPage from './pages/InventoryPage';
import Categories from './pages/Categories';
import TemplatesPage from './pages/TemplatesPage';
import TemplateFormPage from './pages/TemplateFormPage';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/characters"
            element={
              <PrivateRoute>
                <Characters />
              </PrivateRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <PrivateRoute>
                <Categories />
              </PrivateRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <PrivateRoute>
                <TemplatesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/templates/new"
            element={
              <PrivateRoute>
                <TemplateFormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/templates/:templateId/edit"
            element={
              <PrivateRoute>
                <TemplateFormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/characters/:characterId/inventory"
            element={
              <PrivateRoute>
                <InventoryPage />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
