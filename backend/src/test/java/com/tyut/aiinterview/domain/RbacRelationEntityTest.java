package com.tyut.aiinterview.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.baomidou.mybatisplus.annotation.TableId;
import java.lang.reflect.Field;
import org.junit.jupiter.api.Test;

class RbacRelationEntityTest {

    @Test
    void userRoleUsesSurrogatePrimaryKey() throws NoSuchFieldException {
        Field id = UserRole.class.getDeclaredField("id");

        assertEquals(Long.class, id.getType());
        assertNotNull(id.getAnnotation(TableId.class));
        assertEquals("id", id.getAnnotation(TableId.class).value());
    }

    @Test
    void rolePermissionUsesSurrogatePrimaryKey() throws NoSuchFieldException {
        Field id = RolePermission.class.getDeclaredField("id");

        assertEquals(Long.class, id.getType());
        assertNotNull(id.getAnnotation(TableId.class));
        assertEquals("id", id.getAnnotation(TableId.class).value());
    }
}
