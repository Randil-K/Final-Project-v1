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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

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

    /** Multipart so divers can attach certificates: a JSON "data" part plus optional "certificates" files. */
    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AuthResponse> register(@Valid @RequestPart("data") RegisterRequest request,
                                                 @RequestPart(value = "certificates", required = false) List<MultipartFile> certificates) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request, certificates));
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
