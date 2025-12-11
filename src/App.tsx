// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { BreadcrumbProvider } from "./contexts/BreadcrumbContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import SessionManager from "./components/common/SessionManager";
import MainLayout from "./layouts/MainLayout";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import ProjectsPage from "./pages/projects/index";
import ProjectsNewPage from "./pages/projects/new";
import ProjectsEditPage from "./pages/projects/edit";
import IntroBannersPage from "./pages/intro-banners/index";
import IntroBannersNewPage from "./pages/intro-banners/new";
import IntroBannersEditPage from "./pages/intro-banners/edit";
import AboutPage from "./pages/about";
import ContactPage from "./pages/contact";
import NewsList from "./pages/news/index";
import NewsForm from "./components/news/NewsForm";
import HeaderSettingsPage from "./pages/header";
import AboutBannerPage from "./pages/about-banner";
import FooterPage from "./pages/footer";
import IPManagementPage from "./pages/ip-management";
import ServicesListPage from "./pages/services/index";
import ServicesNewPage from "./pages/services/new";
import ServicesEditPage from "./pages/services/edit";
import RecognitionPage from "./pages/recognition/index";
import RecognitionItemsListPage from "./pages/recognition/items/index";
import RecognitionItemsNewPage from "./pages/recognition/items/new";
import RecognitionItemsEditPage from "./pages/recognition/items/edit";
import ClientsPage from "./pages/clients/index";
import ClientsItemsListPage from "./pages/clients/items/index";
import ClientsItemsNewPage from "./pages/clients/items/new";
import ClientsItemsEditPage from "./pages/clients/items/edit";
import LatestProjectsBannerPage from "./pages/latest-projects-banner/index";
import JournalBannerPage from "./pages/journal-banner/index";
import ContactSubmissionsPage from "./pages/contact-submissions";
import ProjectTabsListPage from "./pages/project-tabs/index";
import ProjectTabsNewPage from "./pages/project-tabs/new";
import ProjectTabsEditPage from "./pages/project-tabs/edit";
import GalleryItemsListPage from "./pages/gallery-items/index";
import GalleryItemsNewPage from "./pages/gallery-items/new";
import GalleryItemsEditPage from "./pages/gallery-items/edit";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <BreadcrumbProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/admin/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <SessionManager>
                  <MainLayout />
                </SessionManager>
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/new" element={<ProjectsNewPage />} />
              <Route path="projects/edit/:id" element={<ProjectsEditPage />} />
              <Route path="project-tabs" element={<ProjectTabsListPage />} />
              <Route path="project-tabs/new" element={<ProjectTabsNewPage />} />
              <Route path="project-tabs/edit/:id" element={<ProjectTabsEditPage />} />
              <Route path="gallery-items" element={<GalleryItemsListPage />} />
              <Route path="gallery-items/new" element={<GalleryItemsNewPage />} />
              <Route path="gallery-items/edit/:id" element={<GalleryItemsEditPage />} />
              <Route path="intro-banners" element={<IntroBannersPage />} />
              <Route path="intro-banners/new" element={<IntroBannersNewPage />} />
              <Route path="intro-banners/edit/:id" element={<IntroBannersEditPage />} />
              <Route path="journal-banner" element={<JournalBannerPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="contact-submissions" element={<ContactSubmissionsPage />} />
              <Route path="news/edit/:id" element={<NewsForm />} />
              <Route path="news/new" element={<NewsForm />} />
              <Route path="news" element={<NewsList />} />
              <Route path="header" element={<HeaderSettingsPage />} />
              <Route path="about-banner" element={<AboutBannerPage />} />
              <Route path="footer" element={<FooterPage />} />
              <Route path="ip-management" element={<IPManagementPage />} />
              <Route path="services" element={<ServicesListPage />} />
              <Route path="services/new" element={<ServicesNewPage />} />
              <Route path="services/edit/:id" element={<ServicesEditPage />} />
              <Route path="recognition" element={<RecognitionPage />} />
              <Route path="recognition/items" element={<RecognitionItemsListPage />} />
              <Route path="recognition/items/new" element={<RecognitionItemsNewPage />} />
              <Route path="recognition/items/edit/:id" element={<RecognitionItemsEditPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/items" element={<ClientsItemsListPage />} />
              <Route path="clients/items/new" element={<ClientsItemsNewPage />} />
              <Route path="clients/items/edit/:id" element={<ClientsItemsEditPage />} />
              <Route path="latest-projects-banner" element={<LatestProjectsBannerPage />} />
            </Route>
            
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/admin/login" replace />} />
            <Route path="*" element={<Navigate to="/admin/login" replace />} />
          </Routes>
        </BreadcrumbProvider>
      </AuthProvider>
    </Router>
  );
}
