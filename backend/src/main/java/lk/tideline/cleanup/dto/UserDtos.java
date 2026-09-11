package lk.tideline.cleanup.dto;

import lk.tideline.cleanup.model.CertificationLevel;
import lk.tideline.cleanup.model.DiverProfile;
import lk.tideline.cleanup.model.OrganizationType;
import lk.tideline.cleanup.model.Role;
import lk.tideline.cleanup.model.User;

import java.util.List;

public final class UserDtos {

    private UserDtos() {
    }

    public record UserResponse(
            Long id,
            String fullName,
            String email,
            String phone,
            Role role,
            String province,
            String city,
            Double latitude,
            Double longitude,
            boolean availableForAlerts,
            String organizationName,
            OrganizationType organizationType,
            DiverProfileResponse diverProfile
    ) {
        public static UserResponse from(User user) {
            return new UserResponse(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getPhone(),
                    user.getRole(),
                    user.getProvince(),
                    user.getCity(),
                    user.getLatitude(),
                    user.getLongitude(),
                    user.isAvailableForAlerts(),
                    user.getOrganizationName(),
                    user.getOrganizationType(),
                    DiverProfileResponse.from(user.getDiverProfile()));
        }
    }

    /** Compact author reference embedded in reports, comments and projects. */
    public record UserSummary(Long id, String fullName, Role role) {
        public static UserSummary from(User user) {
            if (user == null) {
                return null;
            }
            return new UserSummary(user.getId(), user.getFullName(), user.getRole());
        }
    }

    public record DiverProfileResponse(
            CertificationLevel certificationLevel,
            Integer experienceYears,
            String equipment,
            List<String> preferredRegions,
            int completedProjects
    ) {
        public static DiverProfileResponse from(DiverProfile profile) {
            if (profile == null) {
                return null;
            }
            return new DiverProfileResponse(
                    profile.getCertificationLevel(),
                    profile.getExperienceYears(),
                    profile.getEquipment(),
                    profile.getPreferredRegions(),
                    profile.getCompletedProjects());
        }
    }

    public record UpdateProfileRequest(
            String fullName,
            String phone,
            String province,
            String city,
            Double latitude,
            Double longitude,
            Boolean availableForAlerts,
            String organizationName,
            OrganizationType organizationType
    ) {
    }

    public record UpdateDiverProfileRequest(
            CertificationLevel certificationLevel,
            Integer experienceYears,
            String equipment,
            List<String> preferredRegions
    ) {
    }
}
