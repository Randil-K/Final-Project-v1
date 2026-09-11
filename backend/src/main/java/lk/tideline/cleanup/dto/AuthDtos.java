package lk.tideline.cleanup.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lk.tideline.cleanup.model.CertificationLevel;
import lk.tideline.cleanup.model.OrganizationType;
import lk.tideline.cleanup.model.Role;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank String fullName,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, message = "must be at least 8 characters") String password,
            String phone,
            Role role,
            String province,
            String city,
            Double latitude,
            Double longitude,
            String organizationName,
            OrganizationType organizationType,
            CertificationLevel certificationLevel
    ) {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {
    }

    public record AuthResponse(
            String token,
            long expiresInSeconds,
            UserDtos.UserResponse user
    ) {
    }
}
