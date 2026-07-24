package com.tyut.aiinterview.user.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("user_role")
public class UserRole {

    private Long userId;
    private Long roleId;
    private Long assignedBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime assignedAt;

    // -- getters --
    public Long getUserId() { return userId; }
    public Long getRoleId() { return roleId; }
    public Long getAssignedBy() { return assignedBy; }
    public LocalDateTime getAssignedAt() { return assignedAt; }

    // -- setters --
    public void setUserId(Long userId) { this.userId = userId; }
    public void setRoleId(Long roleId) { this.roleId = roleId; }
    public void setAssignedBy(Long assignedBy) { this.assignedBy = assignedBy; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }
}
