package lk.tideline.cleanup.controller;

import jakarta.validation.Valid;
import lk.tideline.cleanup.dto.AuthDtos.AuthResponse;
import lk.tideline.cleanup.dto.AuthDtos.LoginRequest;
import lk.tideline.cleanup.dto.AuthDtos.RegisterRequest;
import lk.tideline.cleanup.dto.UserDtos.UserResponse;
import lk.tideline.cleanup.service.AuthService;
import lk.tideline.cleanup.service.CurrentUserService;
import lk.tideline.cleanup.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final CurrentUserService currentUser;

    public AuthController(AuthService authService, UserService userService, CurrentUserService currentUser) {
        this.authService = authService;
        this.userService = userService;
        this.currentUser = currentUser;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me() {
        return userService.view(currentUser.require().getId());
    }
}
