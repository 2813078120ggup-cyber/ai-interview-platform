package com.tyut.aiinterview.user.service;

import com.tyut.aiinterview.user.entity.Role;

import java.util.List;

public interface RoleService {

    List<Role> getAllRoles();

    void initRoles();
}
