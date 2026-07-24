package com.tyut.aiinterview.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

public final class UserDtos {
    private UserDtos() {}

    public record UserQuery(Long pageNo, Long pageSize, String keyword, Integer status) {}
    public record CreateUserRequest(@NotBlank @Size(max = 64) String username, @NotBlank @Size(min = 8, max = 72) String password,
                                    @NotBlank @Size(max = 64) String realName, String email, String phone, @NotEmpty List<Long> roleIds) {}
    public record UpdateStatusRequest(@NotNull Integer status) {}
    public record AssignRolesRequest(@NotEmpty List<Long> roleIds) {}
    public record UserVO(Long id, String username, String realName, String email, String phone, String avatarUrl,
                         Integer status, List<String> roles, LocalDateTime lastLoginAt, LocalDateTime createdAt) {}
    public record UserOption(Long id, String username, String realName) {}
}
