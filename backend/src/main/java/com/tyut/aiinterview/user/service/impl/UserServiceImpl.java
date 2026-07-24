package com.tyut.aiinterview.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.tyut.aiinterview.common.BusinessException;
import com.tyut.aiinterview.security.JwtTokenProvider;
import com.tyut.aiinterview.user.dto.LoginRequest;
import com.tyut.aiinterview.user.dto.LoginResult;
import com.tyut.aiinterview.user.dto.RegisterRequest;
import com.tyut.aiinterview.user.dto.UpdateUserRequest;
import com.tyut.aiinterview.user.entity.Role;
import com.tyut.aiinterview.user.entity.User;
import com.tyut.aiinterview.user.entity.UserRole;
import com.tyut.aiinterview.user.mapper.RoleMapper;
import com.tyut.aiinterview.user.mapper.UserMapper;
import com.tyut.aiinterview.user.mapper.UserRoleMapper;
import com.tyut.aiinterview.user.service.UserService;
import com.tyut.aiinterview.user.vo.UserVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final UserRoleMapper userRoleMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    private static final int MAX_LOGIN_FAILS = 5;
    private final ConcurrentMap<String, LoginFailRecord> loginFailMap = new ConcurrentHashMap<>();

    private static class LoginFailRecord {
        int count;
        long lockUntil;

        LoginFailRecord(int count, long lockUntil) {
            this.count = count;
            this.lockUntil = lockUntil;
        }
    }

    public UserServiceImpl(UserMapper userMapper, RoleMapper roleMapper,
                           UserRoleMapper userRoleMapper, PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider) {
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
        this.userRoleMapper = userRoleMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    @Transactional
    public LoginResult register(RegisterRequest request) {
        if (userMapper.selectCount(new LambdaQueryWrapper<User>().eq(User::getUsername, request.getUsername())) > 0) {
            throw new BusinessException("用户名已存在");
        }

        if (StringUtils.hasText(request.getEmail())
                && userMapper.selectCount(new LambdaQueryWrapper<User>().eq(User::getEmail, request.getEmail())) > 0) {
            throw new BusinessException("邮箱已被注册");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRealName(request.getRealName());
        user.setEmail(request.getEmail());
        user.setStatus(1);
        userMapper.insert(user);

        Role candidateRole = roleMapper.selectOne(
                new LambdaQueryWrapper<Role>().eq(Role::getRoleCode, "CANDIDATE"));
        if (candidateRole != null) {
            UserRole userRole = new UserRole();
            userRole.setUserId(user.getId());
            userRole.setRoleId(candidateRole.getId());
            userRole.setAssignedAt(LocalDateTime.now());
            userRoleMapper.insert(userRole);
        }

        List<String> roles = List.of("CANDIDATE");
        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), roles);

        return buildLoginResult(user, token, roles);
    }

    @Override
    public LoginResult login(LoginRequest request) {
        String account = request.getUsername();

        // Check rate limit (in-memory)
        LoginFailRecord record = loginFailMap.get(account);
        if (record != null && record.count >= MAX_LOGIN_FAILS) {
            if (System.currentTimeMillis() < record.lockUntil) {
                long remainingMinutes = (record.lockUntil - System.currentTimeMillis()) / 60000 + 1;
                throw new BusinessException(429, "登录失败次数过多，请" + remainingMinutes + "分钟后再试");
            } else {
                loginFailMap.remove(account);
            }
        }

        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, account)
                .or()
                .eq(User::getEmail, account));

        if (user == null) {
            incrementFailCount(account);
            throw new BusinessException(401, "用户名或密码错误");
        }

        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BusinessException(401, "账户已被禁用，请联系管理员");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            incrementFailCount(account);
            throw new BusinessException(401, "用户名或密码错误");
        }

        // Login success — clear fail count
        loginFailMap.remove(account);

        user.setLastLoginAt(LocalDateTime.now());
        userMapper.updateById(user);

        List<String> roles = userMapper.selectRoleCodesByUserId(user.getId());
        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), roles);

        return buildLoginResult(user, token, roles);
    }

    @Override
    public LoginResult.UserInfo getCurrentUser(String username) {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        List<String> roles = userMapper.selectRoleCodesByUserId(user.getId());
        return buildUserInfo(user, roles);
    }

    @Override
    public Page<UserVO> listUsers(Integer page, Integer size, String keyword, Integer status) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(User::getUsername, keyword)
                    .or()
                    .like(User::getRealName, keyword)
                    .or()
                    .like(User::getEmail, keyword));
        }
        if (status != null) {
            wrapper.eq(User::getStatus, status);
        }
        wrapper.orderByDesc(User::getCreatedAt);

        IPage<User> userPage = userMapper.selectPage(new Page<>(page, size), wrapper);

        Page<UserVO> voPage = new Page<>(page, size, userPage.getTotal());
        List<UserVO> voList = userPage.getRecords().stream()
                .map(u -> {
                    List<String> roles = userMapper.selectRoleCodesByUserId(u.getId());
                    return buildUserVO(u, roles);
                })
                .collect(Collectors.toList());
        voPage.setRecords(voList);
        return voPage;
    }

    @Override
    public UserVO getUserById(Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        List<String> roles = userMapper.selectRoleCodesByUserId(id);
        return buildUserVO(user, roles);
    }

    @Override
    public void updateUser(Long id, UpdateUserRequest request) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        if (StringUtils.hasText(request.getEmail())
                && !request.getEmail().equals(user.getEmail())
                && userMapper.selectCount(new LambdaQueryWrapper<User>()
                        .eq(User::getEmail, request.getEmail())
                        .ne(User::getId, id)) > 0) {
            throw new BusinessException("邮箱已被其他用户使用");
        }

        if (StringUtils.hasText(request.getRealName())) {
            user.setRealName(request.getRealName());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        userMapper.updateById(user);
    }

    @Override
    public void updateStatus(Long id, Integer status) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        if (status != 0 && status != 1) {
            throw new BusinessException("状态值无效，必须为0或1");
        }
        user.setStatus(status);
        userMapper.updateById(user);
    }

    @Override
    @Transactional
    public void assignRoles(Long id, List<Long> roleIds, Long operatorId) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }

        for (Long roleId : roleIds) {
            if (roleMapper.selectById(roleId) == null) {
                throw new BusinessException("角色ID " + roleId + " 不存在");
            }
        }

        userRoleMapper.deleteByUserId(id);

        for (Long roleId : roleIds) {
            UserRole userRole = new UserRole();
            userRole.setUserId(id);
            userRole.setRoleId(roleId);
            userRole.setAssignedBy(operatorId);
            userRole.setAssignedAt(LocalDateTime.now());
            userRoleMapper.insert(userRole);
        }

        log.info("User {} roles updated to {} by operator {}", id, roleIds, operatorId);
    }

    @Override
    public void deleteUser(Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        userMapper.deleteById(id);
    }

    private LoginResult buildLoginResult(User user, String token, List<String> roles) {
        return LoginResult.of(token, buildUserInfo(user, roles));
    }

    private LoginResult.UserInfo buildUserInfo(User user, List<String> roles) {
        return LoginResult.UserInfo.of(
                user.getId(),
                user.getUsername(),
                user.getRealName(),
                user.getEmail(),
                user.getAvatarUrl(),
                roles
        );
    }

    private UserVO buildUserVO(User user, List<String> roles) {
        return UserVO.of(user, roles);
    }

    private void incrementFailCount(String key) {
        LoginFailRecord record = loginFailMap.computeIfAbsent(key, k -> new LoginFailRecord(0, 0));
        synchronized (record) {
            record.count++;
            if (record.count >= MAX_LOGIN_FAILS) {
                record.lockUntil = System.currentTimeMillis() + 15 * 60 * 1000;
            }
        }
    }
}
