package com.tyut.aiinterview.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.tyut.aiinterview.user.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface UserMapper extends BaseMapper<User> {

    @Select("SELECT r.role_code FROM user_role ur INNER JOIN role r ON ur.role_id = r.id WHERE ur.user_id = #{userId} AND r.status = 1")
    List<String> selectRoleCodesByUserId(@Param("userId") Long userId);
}
