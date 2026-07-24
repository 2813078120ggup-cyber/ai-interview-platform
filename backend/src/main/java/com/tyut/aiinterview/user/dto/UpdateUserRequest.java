package com.tyut.aiinterview.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class UpdateUserRequest {

    @Size(max = 64, message = "姓名长度不能超过64个字符")
    private String realName;

    @Email(message = "邮箱格式不正确")
    private String email;

    private String phone;
    private String avatarUrl;

    public String getRealName() { return realName; }
    public void setRealName(String realName) { this.realName = realName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
