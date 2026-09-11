package lk.tideline.cleanup.controller;

import jakarta.validation.Valid;
import lk.tideline.cleanup.dto.UserDtos.UpdateDiverProfileRequest;
import lk.tideline.cleanup.dto.UserDtos.UpdateProfileRequest;
import lk.tideline.cleanup.dto.UserDtos.UserResponse;
import lk.tideline.cleanup.service.CurrentUserService;
import lk.tideline.cleanup.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final CurrentUserService currentUser;

    public UserController(UserService userService, CurrentUserService currentUser) {
        this.userService = userService;
        this.currentUser = currentUser;
    }

    @GetMapping("/me")
    public UserResponse me() {
        return userService.view(currentUser.require().getId());
    }

    @PutMapping("/me")
    public UserResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(currentUser.require().getId(), request);
    }

    @PutMapping("/me/diver-profile")
    public UserResponse updateDiverProfile(@Valid @RequestBody UpdateDiverProfileRequest request) {
        return userService.updateDiverProfile(currentUser.require().getId(), request);
    }

    @GetMapping("/{id}")
    public UserResponse get(@PathVariable Long id) {
        return userService.view(id);
    }
}
