package com.tyut.aiinterview.user.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("role")
public class Role {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String roleCode;

    private String roleName;

    private String description;

    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // -- getters --
    public Long getId() { return id; }
    public String getRoleCode() { return roleCode; }
    public String getRoleName() { return roleName; }
    public String getDescription() { return description; }
    public Integer getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // -- setters --
    public void setId(Long id) { this.id = id; }
    public void setRoleCode(String roleCode) { this.roleCode = roleCode; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
    public void setDescription(String description) { this.description = description; }
    public void setStatus(Integer status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
