package lk.tideline.cleanup.service;

import lk.tideline.cleanup.dto.AuthDtos.AuthResponse;
import lk.tideline.cleanup.dto.AuthDtos.LoginRequest;
import lk.tideline.cleanup.dto.AuthDtos.RegisterRequest;
import lk.tideline.cleanup.dto.UserDtos.UserResponse;
import lk.tideline.cleanup.model.DiverProfile;
import lk.tideline.cleanup.model.Role;
import lk.tideline.cleanup.model.User;
import lk.tideline.cleanup.repository.UserRepository;
import lk.tideline.cleanup.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new IllegalStateException("An account already uses that email address.");
        }

        Role role = request.role() == null ? Role.CITIZEN : request.role();
        if (role == Role.ADMIN || role == Role.AUTHORITY) {
            // Government officers and administrators are provisioned internally, never self-registered.
            throw new IllegalArgumentException("That role cannot be self-registered. Contact an administrator.");
        }

        User user = new User();
        user.setFullName(request.fullName());
        user.setEmail(request.email().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone());
        user.setRole(role);
        user.setProvince(request.province());
        user.setCity(request.city());
        user.setLatitude(request.latitude());
        user.setLongitude(request.longitude());
        user.setOrganizationName(request.organizationName());
        user.setOrganizationType(request.organizationType());

        if (role == Role.DIVER) {
            DiverProfile profile = new DiverProfile();
            profile.setUser(user);
            profile.setCertificationLevel(request.certificationLevel());
            user.setDiverProfile(profile);
        }

        User saved = userRepository.save(user);
        return tokenFor(saved);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new NotFoundException("No account for " + request.email()));

        return tokenFor(user);
    }

    private AuthResponse tokenFor(User user) {
        return new AuthResponse(jwtService.issueToken(user), jwtService.expirySeconds(), UserResponse.from(user));
    }
}
