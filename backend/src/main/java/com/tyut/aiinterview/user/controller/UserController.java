package com.tyut.aiinterview.user.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tyut.aiinterview.common.ApiResult;
import com.tyut.aiinterview.user.dto.UserPageRequest;
import com.tyut.aiinterview.user.service.UserService;
import com.tyut.aiinterview.user.vo.UserVO;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ApiResult<Page<UserVO>> listUsers(@ModelAttribute UserPageRequest request) {
        Page<UserVO> page = userService.listUsers(
                request.getPage(), request.getSize(),
                request.getKeyword(), request.getStatus());
        return ApiResult.success(page);
    }
}
