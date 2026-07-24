package com.tyut.aiinterview.interview.entity;

import com.baomidou.mybatisplus.annotation.*;
import java.time.LocalDateTime;

@TableName("interview")
public class Interview {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String title;
    private Long candidateId;
    private Long interviewerId;
    private LocalDateTime scheduledAt;
    private Integer duration;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Integer status;
    private String type;
    private String meetingUrl;
    private String remark;
    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // -- getters --
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public Long getCandidateId() { return candidateId; }
    public Long getInterviewerId() { return interviewerId; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public Integer getDuration() { return duration; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public Integer getStatus() { return status; }
    public String getType() { return type; }
    public String getMeetingUrl() { return meetingUrl; }
    public String getRemark() { return remark; }
    public Long getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // -- setters --
    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setCandidateId(Long candidateId) { this.candidateId = candidateId; }
    public void setInterviewerId(Long interviewerId) { this.interviewerId = interviewerId; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
    public void setStatus(Integer status) { this.status = status; }
    public void setType(String type) { this.type = type; }
    public void setMeetingUrl(String meetingUrl) { this.meetingUrl = meetingUrl; }
    public void setRemark(String remark) { this.remark = remark; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
