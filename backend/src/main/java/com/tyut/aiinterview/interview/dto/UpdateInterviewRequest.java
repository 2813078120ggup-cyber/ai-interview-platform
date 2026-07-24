package com.tyut.aiinterview.interview.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class UpdateInterviewRequest {

    private String title;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime scheduledAt;
    private Integer duration;
    private String meetingUrl;
    private String remark;

    // -- getters and setters --
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public String getMeetingUrl() { return meetingUrl; }
    public void setMeetingUrl(String meetingUrl) { this.meetingUrl = meetingUrl; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
