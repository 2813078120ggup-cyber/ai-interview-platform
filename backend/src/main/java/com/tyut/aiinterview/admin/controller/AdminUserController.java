package com.tyut.aiinterview.admin.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tyut.aiinterview.common.ApiResult;
import com.tyut.aiinterview.user.dto.AssignRolesRequest;
import com.tyut.aiinterview.user.dto.UpdateUserRequest;
import com.tyut.aiinterview.user.dto.UserPageRequest;
import com.tyut.aiinterview.user.entity.Role;
import com.tyut.aiinterview.user.service.RoleService;
import com.tyut.aiinterview.user.service.UserService;
import com.tyut.aiinterview.user.vo.UserVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminUserController {

    private final UserService userService;
    private final RoleService roleService;

    public AdminUserController(UserService userService, RoleService roleService) {
        this.userService = userService;
        this.roleService = roleService;
    }

    @GetMapping("/users")
    public ApiResult<Page<UserVO>> listUsers(@ModelAttribute UserPageRequest request) {
        Page<UserVO> page = userService.listUsers(
                request.getPage(), request.getSize(),
                request.getKeyword(), request.getStatus());
        return ApiResult.success(page);
    }

    @GetMapping("/users/{id}")
    public ApiResult<UserVO> getUser(@PathVariable Long id) {
        UserVO user = userService.getUserById(id);
        return ApiResult.success(user);
    }

    @PutMapping("/users/{id}")
    public ApiResult<Void> updateUser(@PathVariable Long id,
                                       @Valid @RequestBody UpdateUserRequest request) {
        userService.updateUser(id, request);
        return ApiResult.success();
    }

    @PutMapping("/users/{id}/status")
    public ApiResult<Void> updateStatus(@PathVariable Long id,
                                         @RequestParam Integer status) {
        userService.updateStatus(id, status);
        return ApiResult.success();
    }

    @PutMapping("/users/{id}/roles")
    public ApiResult<Void> assignRoles(@PathVariable Long id,
                                        @Valid @RequestBody AssignRolesRequest request,
                                        Principal principal) {
        Long operatorId = getOperatorId(principal);
        userService.assignRoles(id, request.getRoleIds(), operatorId);
        return ApiResult.success();
    }

    @DeleteMapping("/users/{id}")
    public ApiResult<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ApiResult.success();
    }

    @GetMapping("/roles")
    public ApiResult<List<Role>> listRoles() {
        List<Role> roles = roleService.getAllRoles();
        return ApiResult.success(roles);
    }

    private Long getOperatorId(Principal principal) {
        if (principal == null) return null;
        var userInfo = userService.getCurrentUser(principal.getName());
        return userInfo != null ? userInfo.getId() : null;
    }
}
