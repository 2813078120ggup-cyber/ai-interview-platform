package com.tyut.aiinterview.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tyut.aiinterview.user.entity.Role;
import com.tyut.aiinterview.user.mapper.RoleMapper;
import com.tyut.aiinterview.user.service.RoleService;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RoleServiceImpl implements RoleService {

    private static final Logger log = LoggerFactory.getLogger(RoleServiceImpl.class);

    private final RoleMapper roleMapper;

    public RoleServiceImpl(RoleMapper roleMapper) {
        this.roleMapper = roleMapper;
    }

    @Override
    public List<Role> getAllRoles() {
        return roleMapper.selectList(new LambdaQueryWrapper<Role>().eq(Role::getStatus, 1));
    }

    @Override
    @PostConstruct
    @Transactional
    public void initRoles() {
        ensureRole("CANDIDATE", "候选人", "参与面试的候选人");
        ensureRole("INTERVIEWER", "面试官", "主持面试的面试官");
        ensureRole("HR", "HR", "人力资源管理人员");
        ensureRole("ADMIN", "系统管理员", "系统管理员");
        log.info("Roles initialized successfully");
    }

    private void ensureRole(String code, String name, String description) {
        if (roleMapper.selectCount(new LambdaQueryWrapper<Role>().eq(Role::getRoleCode, code)) == 0) {
            Role role = new Role();
            role.setRoleCode(code);
            role.setRoleName(name);
            role.setDescription(description);
            role.setStatus(1);
            roleMapper.insert(role);
            log.info("Created role: {}", code);
        }
    }
}
