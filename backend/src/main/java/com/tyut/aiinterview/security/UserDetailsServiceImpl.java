package com.tyut.aiinterview.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.tyut.aiinterview.user.entity.User;
import com.tyut.aiinterview.user.mapper.UserMapper;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserMapper userMapper;

    public UserDetailsServiceImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username)
                .or()
                .eq(User::getEmail, username));

        if (user == null) {
            throw new UsernameNotFoundException("用户不存在: " + username);
        }

        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new UsernameNotFoundException("账户已被禁用");
        }

        List<String> roleCodes = userMapper.selectRoleCodesByUserId(user.getId());
        List<SimpleGrantedAuthority> authorities = roleCodes.stream()
                .map(rc -> new SimpleGrantedAuthority("ROLE_" + rc))
                .collect(Collectors.toList());

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPasswordHash())
                .authorities(authorities)
                .accountLocked(false)
                .disabled(user.getStatus() != null && user.getStatus() == 0)
                .build();
    }
}
