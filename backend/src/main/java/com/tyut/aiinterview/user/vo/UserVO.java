package com.tyut.aiinterview.user.vo;

import com.tyut.aiinterview.user.entity.User;
import java.time.LocalDateTime;
import java.util.List;

public class UserVO {

    private Long id;
    private String username;
    private String realName;
    private String email;
    private String phone;
    private String avatarUrl;
    private Integer status;
    private List<String> roles;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getRealName() { return realName; }
    public void setRealName(String realName) { this.realName = realName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static UserVO of(User user, List<String> roles) {
        UserVO vo = new UserVO();
        vo.id = user.getId();
        vo.username = user.getUsername();
        vo.realName = user.getRealName();
        vo.email = user.getEmail();
        vo.phone = user.getPhone();
        vo.avatarUrl = user.getAvatarUrl();
        vo.status = user.getStatus();
        vo.roles = roles;
        vo.lastLoginAt = user.getLastLoginAt();
        vo.createdAt = user.getCreatedAt();
        return vo;
    }
}
