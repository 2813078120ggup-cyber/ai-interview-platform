package com.tyut.aiinterview.interview.dto;

import com.tyut.aiinterview.interview.entity.Interview;
import java.time.LocalDateTime;

public class InterviewVO {

    private Long id;
    private String title;
    private Long candidateId;
    private String candidateName;
    private Long interviewerId;
    private String interviewerName;
    private LocalDateTime scheduledAt;
    private Integer duration;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Integer status;
    private String statusText;
    private String type;
    private String meetingUrl;
    private String remark;
    private Long createdBy;
    private LocalDateTime createdAt;

    public static InterviewVO from(Interview iv) {
        InterviewVO vo = new InterviewVO();
        vo.id = iv.getId();
        vo.title = iv.getTitle();
        vo.candidateId = iv.getCandidateId();
        vo.interviewerId = iv.getInterviewerId();
        vo.scheduledAt = iv.getScheduledAt();
        vo.duration = iv.getDuration();
        vo.startedAt = iv.getStartedAt();
        vo.endedAt = iv.getEndedAt();
        vo.status = iv.getStatus();
        vo.type = iv.getType();
        vo.meetingUrl = iv.getMeetingUrl();
        vo.remark = iv.getRemark();
        vo.createdBy = iv.getCreatedBy();
        vo.createdAt = iv.getCreatedAt();
        return vo;
    }

    // -- getters and setters --
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Long getCandidateId() { return candidateId; }
    public void setCandidateId(Long candidateId) { this.candidateId = candidateId; }
    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }
    public Long getInterviewerId() { return interviewerId; }
    public void setInterviewerId(Long interviewerId) { this.interviewerId = interviewerId; }
    public String getInterviewerName() { return interviewerName; }
    public void setInterviewerName(String interviewerName) { this.interviewerName = interviewerName; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public String getStatusText() { return statusText; }
    public void setStatusText(String statusText) { this.statusText = statusText; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getMeetingUrl() { return meetingUrl; }
    public void setMeetingUrl(String meetingUrl) { this.meetingUrl = meetingUrl; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
