package lk.tideline.cleanup.service;

import lk.tideline.cleanup.dto.UserDtos.AdminUserResponse;
import lk.tideline.cleanup.dto.UserDtos.SuspensionRequest;
import lk.tideline.cleanup.dto.UserDtos.UpdateDiverProfileRequest;
import lk.tideline.cleanup.dto.UserDtos.UpdateProfileRequest;
import lk.tideline.cleanup.dto.UserDtos.UserResponse;
import lk.tideline.cleanup.model.DiverProfile;
import lk.tideline.cleanup.model.Role;
import lk.tideline.cleanup.model.User;
import lk.tideline.cleanup.repository.ProjectParticipantRepository;
import lk.tideline.cleanup.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProjectParticipantRepository participantRepository;

    public UserService(UserRepository userRepository, ProjectParticipantRepository participantRepository) {
        this.userRepository = userRepository;
        this.participantRepository = participantRepository;
    }

    /** Re-loads inside a transaction so the lazy diver profile can be mapped. */
    @Transactional(readOnly = true)
    public UserResponse view(Long id) {
        return toResponse(get(id));
    }

    private User get(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User " + id + " was not found."));
    }

    private UserResponse toResponse(User user) {
        Double average = participantRepository.averageMark(user.getId());
        long marked = participantRepository.countByUserIdAndContributionMarkIsNotNull(user.getId());
        return UserResponse.from(user,
                average == null ? null : Math.round(average * 10) / 10.0,
                (int) marked);
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = get(userId);

        if (request.fullName() != null) {
            user.setFullName(request.fullName());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        if (request.province() != null) {
            user.setProvince(request.province());
        }
        if (request.city() != null) {
            user.setCity(request.city());
        }
        if (request.latitude() != null) {
            user.setLatitude(request.latitude());
        }
        if (request.longitude() != null) {
            user.setLongitude(request.longitude());
        }
        if (request.availableForAlerts() != null) {
            user.setAvailableForAlerts(request.availableForAlerts());
        }
        if (request.organizationName() != null) {
            user.setOrganizationName(request.organizationName());
        }
        if (request.organizationType() != null) {
            user.setOrganizationType(request.organizationType());
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateDiverProfile(Long userId, UpdateDiverProfileRequest request) {
        User user = get(userId);

        if (user.getRole() != Role.DIVER) {
            throw new IllegalStateException("Only a volunteer diver has a diving profile.");
        }

        DiverProfile profile = user.getDiverProfile();
        if (profile == null) {
            profile = new DiverProfile();
            profile.setUser(user);
            user.setDiverProfile(profile);
        }

        if (request.certificationLevel() != null) {
            profile.setCertificationLevel(request.certificationLevel());
        }
        if (request.experienceYears() != null) {
            profile.setExperienceYears(request.experienceYears());
        }
        if (request.equipment() != null) {
            profile.setEquipment(request.equipment());
        }
        if (request.preferredRegions() != null) {
            profile.setPreferredRegions(new ArrayList<>(request.preferredRegions()));
        }

        return toResponse(userRepository.save(user));
    }

    /** Module 4 — account list for administrators, optionally filtered by name or email. */
    @Transactional(readOnly = true)
    public List<AdminUserResponse> listForAdmin(String query) {
        String needle = query == null ? "" : query.trim().toLowerCase();
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(user -> needle.isEmpty()
                        || user.getFullName().toLowerCase().contains(needle)
                        || user.getEmail().toLowerCase().contains(needle))
                .map(AdminUserResponse::from)
                .toList();
    }

    /** Module 4 — suspend or reinstate an abusive account. */
    @Transactional
    public AdminUserResponse setSuspension(Long userId, SuspensionRequest request) {
        User user = get(userId);

        if (user.getRole() == Role.ADMIN) {
            throw new IllegalStateException("Administrator accounts cannot be suspended here.");
        }
        if (request.suspended() && (request.reason() == null || request.reason().isBlank())) {
            throw new IllegalArgumentException("Give a reason for the suspension so other administrators can see why.");
        }

        user.setSuspended(request.suspended());
        user.setSuspensionReason(request.suspended() ? request.reason().trim() : null);
        return AdminUserResponse.from(userRepository.save(user));
    }
}
