package com.tyut.aiinterview.user.mapper;

import com.tyut.aiinterview.user.entity.UserRole;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface UserRoleMapper {

    @Insert("INSERT INTO user_role (user_id, role_id, assigned_by, assigned_at) VALUES (#{userId}, #{roleId}, #{assignedBy}, #{assignedAt})")
    int insert(UserRole userRole);

    @Delete("DELETE FROM user_role WHERE user_id = #{userId}")
    int deleteByUserId(Long userId);

    @Delete("DELETE FROM user_role WHERE user_id = #{userId} AND role_id = #{roleId}")
    int deleteByUserIdAndRoleId(@Param("userId") Long userId, @Param("roleId") Long roleId);

    @Select("SELECT ur.user_id, ur.role_id, ur.assigned_by, ur.assigned_at FROM user_role ur WHERE ur.user_id = #{userId}")
    @Results({
            @Result(property = "userId", column = "user_id"),
            @Result(property = "roleId", column = "role_id"),
            @Result(property = "assignedBy", column = "assigned_by"),
            @Result(property = "assignedAt", column = "assigned_at")
    })
    List<UserRole> selectByUserId(Long userId);
}
