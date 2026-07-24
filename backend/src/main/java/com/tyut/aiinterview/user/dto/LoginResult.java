package com.tyut.aiinterview.user.dto;

import java.util.List;

public class LoginResult {

    private String token;
    private UserInfo user;

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public UserInfo getUser() { return user; }
    public void setUser(UserInfo user) { this.user = user; }

    public static LoginResult of(String token, UserInfo user) {
        LoginResult r = new LoginResult();
        r.token = token;
        r.user = user;
        return r;
    }

    public static class UserInfo {
        private Long id;
        private String username;
        private String realName;
        private String email;
        private String avatarUrl;
        private List<String> roles;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getRealName() { return realName; }
        public void setRealName(String realName) { this.realName = realName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getAvatarUrl() { return avatarUrl; }
        public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
        public List<String> getRoles() { return roles; }
        public void setRoles(List<String> roles) { this.roles = roles; }

        public static UserInfo of(Long id, String username, String realName, String email,
                                   String avatarUrl, List<String> roles) {
            UserInfo ui = new UserInfo();
            ui.id = id;
            ui.username = username;
            ui.realName = realName;
            ui.email = email;
            ui.avatarUrl = avatarUrl;
            ui.roles = roles;
            return ui;
        }
    }
}
