package com.tyut.aiinterview.config;

import com.tyut.aiinterview.user.entity.Role;
import com.tyut.aiinterview.user.entity.User;
import com.tyut.aiinterview.user.entity.UserRole;
import com.tyut.aiinterview.user.mapper.RoleMapper;
import com.tyut.aiinterview.user.mapper.UserMapper;
import com.tyut.aiinterview.user.mapper.UserRoleMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final UserRoleMapper userRoleMapper;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserMapper userMapper, RoleMapper roleMapper,
                      UserRoleMapper userRoleMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
        this.userRoleMapper = userRoleMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedUser("admin", "123456", "Admin", "admin@test.com", "ADMIN");
        seedUser("hr001", "123456", "HR Zhang", "hr@test.com", "HR");
        seedUser("interviewer01", "123456", "Li Interviewer", "interviewer@test.com", "INTERVIEWER");
        seedUser("candidate01", "123456", "Wang Candidate", "candidate@test.com", "CANDIDATE");
        log.info("Seed data check completed");
    }

    private void seedUser(String username, String password, String realName, String email, String roleCode) {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
        if (user == null) {
            user = new User();
            user.setUsername(username);
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setRealName(realName);
            user.setEmail(email);
            user.setStatus(1);
            userMapper.insert(user);
        }

        // Ensure role is assigned
        Role role = roleMapper.selectOne(new LambdaQueryWrapper<Role>().eq(Role::getRoleCode, roleCode));
        if (role == null) return;

        List<UserRole> existing = userRoleMapper.selectByUserId(user.getId());
        boolean hasRole = existing.stream().anyMatch(ur -> ur.getRoleId().equals(role.getId()));
        if (!hasRole) {
            UserRole userRole = new UserRole();
            userRole.setUserId(user.getId());
            userRole.setRoleId(role.getId());
            userRole.setAssignedAt(LocalDateTime.now());
            userRoleMapper.insert(userRole);
        }

        log.info("Seeded user: {} with role {}", username, roleCode);
    }
}
