package lk.tideline.cleanup.service;

import lk.tideline.cleanup.dto.UserDtos.UpdateDiverProfileRequest;
import lk.tideline.cleanup.dto.UserDtos.UpdateProfileRequest;
import lk.tideline.cleanup.dto.UserDtos.UserResponse;
import lk.tideline.cleanup.model.DiverProfile;
import lk.tideline.cleanup.model.Role;
import lk.tideline.cleanup.model.User;
import lk.tideline.cleanup.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Re-loads inside a transaction so the lazy diver profile can be mapped. */
    @Transactional(readOnly = true)
    public UserResponse view(Long id) {
        return UserResponse.from(get(id));
    }

    private User get(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User " + id + " was not found."));
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

        return UserResponse.from(userRepository.save(user));
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

        return UserResponse.from(userRepository.save(user));
    }
}
