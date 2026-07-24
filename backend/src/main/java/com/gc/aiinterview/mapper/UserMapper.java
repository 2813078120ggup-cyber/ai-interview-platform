package com.gc.aiinterview.mapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.gc.aiinterview.domain.UserAccount;
import org.apache.ibatis.annotations.Mapper;
@Mapper public interface UserMapper extends BaseMapper<UserAccount> {}
