package com.tyut.aiinterview.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tyut.aiinterview.domain.Role;
import com.tyut.aiinterview.mapper.RoleMapper;
import org.springframework.stereotype.Service;

/** Resolves fixed platform roles by stable business code rather than database IDs. */
@Service
public class SystemRoleService {
    public static final String ADMIN = "ADMIN";
    public static final String CANDIDATE = "CANDIDATE";

    private final RoleMapper roleMapper;

    public SystemRoleService(RoleMapper roleMapper) {
        this.roleMapper = roleMapper;
    }

    public Long requireActiveRoleId(String roleCode) {
        Role role = roleMapper.selectOne(new LambdaQueryWrapper<Role>()
                .eq(Role::getRoleCode, roleCode)
                .eq(Role::getStatus, 1));
        if (role == null) {
            throw new IllegalStateException("缺少启用的系统角色：" + roleCode);
        }
        return role.getId();
    }
}
