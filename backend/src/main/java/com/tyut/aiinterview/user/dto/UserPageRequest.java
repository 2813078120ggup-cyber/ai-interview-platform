package com.tyut.aiinterview.user.dto;

public class UserPageRequest {

    private Integer page = 1;
    private Integer size = 10;
    private String keyword;
    private Integer status;

    public Integer getPage() { return page; }
    public void setPage(Integer page) { this.page = page; }
    public Integer getSize() { return size; }
    public void setSize(Integer size) { this.size = size; }
    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
}
