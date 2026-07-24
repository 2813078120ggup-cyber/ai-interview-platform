package com.tyut.aiinterview.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.tyut.aiinterview.domain.Role;
import com.tyut.aiinterview.mapper.RoleMapper;
import org.junit.jupiter.api.Test;

class SystemRoleServiceTest {

    @Test
    void resolvesCandidateByBusinessCodeInsteadOfDatabaseId() {
        RoleMapper mapper = mock(RoleMapper.class);
        Role role = new Role();
        role.setId(88L);
        role.setRoleCode(SystemRoleService.CANDIDATE);
        role.setStatus(1);
        when(mapper.selectOne(any())).thenReturn(role);

        Long roleId = new SystemRoleService(mapper).requireActiveRoleId(SystemRoleService.CANDIDATE);

        assertEquals(88L, roleId);
    }

    @Test
    void rejectsMissingOrDisabledSystemRole() {
        RoleMapper mapper = mock(RoleMapper.class);
        when(mapper.selectOne(any())).thenReturn(null);

        assertThrows(IllegalStateException.class,
                () -> new SystemRoleService(mapper).requireActiveRoleId(SystemRoleService.CANDIDATE));
    }
}
