package lk.tideline.cleanup.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lk.tideline.cleanup.model.CertificationLevel;
import lk.tideline.cleanup.model.DiverProfile;
import lk.tideline.cleanup.model.OrganizationType;
import lk.tideline.cleanup.model.Role;
import lk.tideline.cleanup.model.User;

import java.time.Instant;
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
            DiverProfileResponse diverProfile,
            /** Average organiser rating (1-5) across completed cleanups; null until someone rates them. */
            Double averageMark,
            Integer markedCleanups
    ) {
        public static UserResponse from(User user) {
            return from(user, null, null);
        }

        public static UserResponse from(User user, Double averageMark, Integer markedCleanups) {
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
                    DiverProfileResponse.from(user.getDiverProfile()),
                    averageMark,
                    markedCleanups);
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

    /** Admin view of an account (module 4). */
    public record AdminUserResponse(
            Long id,
            String fullName,
            String email,
            Role role,
            String province,
            String city,
            boolean suspended,
            String suspensionReason,
            Instant createdAt
    ) {
        public static AdminUserResponse from(User user) {
            return new AdminUserResponse(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getRole(),
                    user.getProvince(),
                    user.getCity(),
                    user.isSuspended(),
                    user.getSuspensionReason(),
                    user.getCreatedAt());
        }
    }

    public record SuspensionRequest(
            @NotNull Boolean suspended,
            @Size(max = 500) String reason
    ) {
    }
}
