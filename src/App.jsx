import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Landing from './pages/Landing.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

import VolunteerShell from './layouts/VolunteerShell.jsx';
import Feed from './pages/volunteer/Feed.jsx';
import ReportDetail from './pages/volunteer/ReportDetail.jsx';
import SubmitReport from './pages/volunteer/SubmitReport.jsx';
import Alerts from './pages/volunteer/Alerts.jsx';
import Opportunities from './pages/volunteer/Opportunities.jsx';
import Profile from './pages/volunteer/Profile.jsx';

import AuthorityShell from './layouts/AuthorityShell.jsx';
import Queue from './pages/authority/Queue.jsx';
import ReportReview from './pages/authority/ReportReview.jsx';
import Projects from './pages/authority/Projects.jsx';
import ProjectDetail from './pages/authority/ProjectDetail.jsx';
import Analytics from './pages/authority/Analytics.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/app" element={<VolunteerShell />}>
          <Route index element={<Feed />} />
          <Route path="report/:id" element={<ReportDetail />} />
          <Route path="submit" element={<SubmitReport />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="/console" element={<AuthorityShell />}>
          <Route index element={<Queue />} />
          <Route path="reports/:id" element={<ReportReview />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
