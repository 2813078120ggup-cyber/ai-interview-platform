package com.tyut.aiinterview.interview.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

public class CreateInterviewRequest {

    @NotBlank(message = "面试标题不能为空")
    private String title;

    @NotNull(message = "候选人不能为空")
    private Long candidateId;

    @NotNull(message = "面试官不能为空")
    private Long interviewerId;

    @NotNull(message = "预约时间不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime scheduledAt;

    @NotNull(message = "时长不能为空")
    private Integer duration;

    @NotBlank(message = "面试类型不能为空")
    private String type;

    private String meetingUrl;
    private String remark;

    @NotNull(message = "题目列表不能为空")
    private List<Long> questionIds;

    // -- getters and setters --
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Long getCandidateId() { return candidateId; }
    public void setCandidateId(Long candidateId) { this.candidateId = candidateId; }
    public Long getInterviewerId() { return interviewerId; }
    public void setInterviewerId(Long interviewerId) { this.interviewerId = interviewerId; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getMeetingUrl() { return meetingUrl; }
    public void setMeetingUrl(String meetingUrl) { this.meetingUrl = meetingUrl; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    public List<Long> getQuestionIds() { return questionIds; }
    public void setQuestionIds(List<Long> questionIds) { this.questionIds = questionIds; }
}
