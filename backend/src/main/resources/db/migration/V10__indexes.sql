-- V10 — NF-6 (retrieve data efficiently) and NF-32 (scale with more users, requests, projects).
-- Every index here backs a query a repository actually runs; nothing speculative.
-- Foreign keys already carry their own index on MySQL, so those are not repeated.
--
-- Note on (latitude, longitude): AlertService filters by Haversine distance in Java, so this
-- cannot become an index seek. It is here to make the scan of candidate users cheaper by
-- keeping the coordinates together. A real spatial index would need MySQL POINT / SPATIAL,
-- which H2 in MySQL mode cannot run, so it is deliberately left out.

-- PollutionReportRepository.search / searchIn: filter on status, order by created_at desc
CREATE INDEX idx_pollution_reports_status_created ON pollution_reports (status, created_at);
CREATE INDEX idx_pollution_reports_created ON pollution_reports (created_at);
-- countByReporterId, and the reporter's own list
CREATE INDEX idx_pollution_reports_reporter ON pollution_reports (reporter_id);
-- search(...) filters on severity, and countGroupedByProvince groups on province
CREATE INDEX idx_pollution_reports_severity ON pollution_reports (severity);
CREATE INDEX idx_pollution_reports_province ON pollution_reports (province);
-- REQ-58 / REQ-59 region rollups and filters
CREATE INDEX idx_pollution_reports_province_id ON pollution_reports (province_id);
CREATE INDEX idx_pollution_reports_district_id ON pollution_reports (district_id);
-- AlertService.notifyNearby reads every report coordinate
CREATE INDEX idx_pollution_reports_lat_lon ON pollution_reports (latitude, longitude);

-- UserRepository.findByAvailableForAlertsTrue, then a Haversine filter in Java
CREATE INDEX idx_users_available_for_alerts ON users (available_for_alerts);
CREATE INDEX idx_users_lat_lon ON users (latitude, longitude);
-- findByRole, findByAccountStatusAndRoleInOrderByCreatedAtAsc, countByRoleIn
CREATE INDEX idx_users_role_account_status ON users (role, account_status);
-- findAllByOrderByCreatedAtDesc
CREATE INDEX idx_users_created ON users (created_at);
CREATE INDEX idx_users_province_id ON users (province_id);

-- AlertRepository.countByRecipientAndReadFlagFalse and findByRecipientOrderByCreatedAtDesc
CREATE INDEX idx_alerts_recipient_read ON alerts (recipient_id, read_flag);
CREATE INDEX idx_alerts_recipient_created ON alerts (recipient_id, created_at);

-- CleanupProjectRepository: findByStatusOrderByCreatedAtDesc, countByStatus,
-- findByOwnerIdOrderByCreatedAtDesc, findFirstByReportId / existsByReportId
CREATE INDEX idx_cleanup_projects_status_created ON cleanup_projects (status, created_at);
CREATE INDEX idx_cleanup_projects_owner ON cleanup_projects (owner_id);
CREATE INDEX idx_cleanup_projects_report ON cleanup_projects (report_id);
CREATE INDEX idx_cleanup_projects_province_id ON cleanup_projects (province_id);

-- ProjectParticipantRepository.findByUser, averageMark, countByProjectAndParticipantRole
CREATE INDEX idx_project_participants_user ON project_participants (user_id);
CREATE INDEX idx_project_participants_project_role ON project_participants (project_id, participant_role);

-- The project timeline (REQ-46)
CREATE INDEX idx_project_updates_project_created ON project_updates (project_id, created_at);

-- VerificationVoteRepository.countByReportAndConfirmed, recalculated on every vote
CREATE INDEX idx_verification_votes_report_confirmed ON verification_votes (report_id, confirmed);

-- ReportCommentRepository.findByReportOrderByCreatedAtAsc, and reply threads
CREATE INDEX idx_report_comments_report_created ON report_comments (report_id, created_at);
CREATE INDEX idx_report_comments_parent ON report_comments (parent_id);

-- OpportunityRepository.findByOpenTrueOrderByCreatedAtDesc / findByOrganizationOrderByCreatedAtDesc
CREATE INDEX idx_opportunities_open_created ON opportunities (open, created_at);
CREATE INDEX idx_opportunities_organization ON opportunities (organization_id);

-- OpportunityApplicationRepository.findByDiverOrderByCreatedAtDesc / findByOpportunity
CREATE INDEX idx_opportunity_applications_diver_created ON opportunity_applications (diver_id, created_at);
CREATE INDEX idx_opportunity_applications_opportunity ON opportunity_applications (opportunity_id);

-- InfoRequestRepository.findByReportOrderByCreatedAtDesc and existsByReportAndStatus
CREATE INDEX idx_info_requests_report_created ON info_requests (report_id, created_at);
CREATE INDEX idx_info_requests_report_status ON info_requests (report_id, status);

-- PasswordResetTokenRepository.findByUserAndUsedAtIsNull
CREATE INDEX idx_password_reset_tokens_user_used ON password_reset_tokens (user_id, used_at);
