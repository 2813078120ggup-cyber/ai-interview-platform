package com.tyut.aiinterview.user.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("user")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private String passwordHash;

    private String realName;

    private String email;

    private String phone;

    private String avatarUrl;

    private Integer status;

    private LocalDateTime lastLoginAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;

    // -- getters --
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public String getRealName() { return realName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getAvatarUrl() { return avatarUrl; }
    public Integer getStatus() { return status; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getDeletedAt() { return deletedAt; }

    // -- setters --
    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setRealName(String realName) { this.realName = realName; }
    public void setEmail(String email) { this.email = email; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public void setStatus(Integer status) { this.status = status; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
}
