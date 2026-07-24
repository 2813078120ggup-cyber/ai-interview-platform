package com.tyut.aiinterview.user.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tyut.aiinterview.user.dto.LoginRequest;
import com.tyut.aiinterview.user.dto.LoginResult;
import com.tyut.aiinterview.user.dto.RegisterRequest;
import com.tyut.aiinterview.user.dto.UpdateUserRequest;
import com.tyut.aiinterview.user.vo.UserVO;

import java.util.List;

public interface UserService {

    LoginResult register(RegisterRequest request);

    LoginResult login(LoginRequest request);

    LoginResult.UserInfo getCurrentUser(String username);

    Page<UserVO> listUsers(Integer page, Integer size, String keyword, Integer status);

    UserVO getUserById(Long id);

    void updateUser(Long id, UpdateUserRequest request);

    void updateStatus(Long id, Integer status);

    void assignRoles(Long id, List<Long> roleIds, Long operatorId);

    void deleteUser(Long id);
}
