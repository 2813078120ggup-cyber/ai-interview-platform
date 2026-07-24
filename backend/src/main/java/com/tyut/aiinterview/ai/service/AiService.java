package com.tyut.aiinterview.ai.service;

import com.tyut.aiinterview.ai.client.LlmClient;
import com.tyut.aiinterview.ai.dto.ChatMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiService {

    private final LlmClient llmClient;

    public String generateQuestion(String jobType, String skillLevel, int count) {
        String systemPrompt = "你是一个专业的技术面试官。请根据以下要求生成面试题目：";
        String userPrompt = String.format(
                "职位类型：%s\n技能水平：%s\n题目数量：%d\n请生成相应的面试题目，包括题目描述和预期答案要点。",
                jobType, skillLevel, count
        );
        return llmClient.chatWithSystemPrompt(systemPrompt, userPrompt);
    }

    public String generateFollowUpQuestion(String originalQuestion, String candidateAnswer) {
        String systemPrompt = "你是一个专业的技术面试官。根据候选人的回答，生成一个深度追问问题，以进一步考察候选人的理解和能力。";
        String userPrompt = String.format(
                "原题：%s\n候选人回答：%s\n请生成一个追问问题。",
                originalQuestion, candidateAnswer
        );
        return llmClient.chatWithSystemPrompt(systemPrompt, userPrompt);
    }

    public String evaluateAnswer(String question, String answer, String evaluationCriteria) {
        String systemPrompt = "你是一个专业的面试评测专家。请根据以下标准对候选人的回答进行评分和评价。";
        String userPrompt = String.format(
                "题目：%s\n候选人回答：%s\n评测标准：%s\n请给出详细的评分（专业能力、表达能力、逻辑思维、应变能力各0-100分）和评语。",
                question, answer, evaluationCriteria
        );
        return llmClient.chatWithSystemPrompt(systemPrompt, userPrompt);
    }

    public String generateInterviewReport(String interviewSummary, List<String> evaluations) {
        String systemPrompt = "你是一个专业的HR分析师。请根据面试过程和评测结果，生成一份专业的面试报告。";
        String userPrompt = String.format(
                "面试概述：%s\n各题评测结果：%s\n请生成一份包含综合评分、优势分析、不足分析和改进建议的面试报告。",
                interviewSummary, evaluations
        );
        return llmClient.chatWithSystemPrompt(systemPrompt, userPrompt);
    }

    public String conductInterview(String jobType, String candidateInfo) {
        String systemPrompt = "你是一个专业的AI面试官。请根据候选人的背景和职位要求，开始第一轮面试提问。";
        String userPrompt = String.format(
                "职位类型：%s\n候选人信息：%s\n请提出第一个面试问题。",
                jobType, candidateInfo
        );
        return llmClient.chatWithSystemPrompt(systemPrompt, userPrompt);
    }

    public String continueInterview(List<ChatMessage> conversationHistory) {
        return llmClient.chat(conversationHistory);
    }

    public String multiModalAnalyze(String text, String audioTranscript, String videoAnalysis) {
        String systemPrompt = "你是一个多模态分析专家。请综合分析文本回答、语音转写和视频分析结果，给出全面的评价。";
        StringBuilder userPrompt = new StringBuilder();
        if (text != null && !text.isEmpty()) {
            userPrompt.append("文本回答：").append(text).append("\n");
        }
        if (audioTranscript != null && !audioTranscript.isEmpty()) {
            userPrompt.append("语音转写：").append(audioTranscript).append("\n");
        }
        if (videoAnalysis != null && !videoAnalysis.isEmpty()) {
            userPrompt.append("视频分析：").append(videoAnalysis).append("\n");
        }
        userPrompt.append("请给出综合评价。");
        return llmClient.chatWithSystemPrompt(systemPrompt, userPrompt.toString());
    }
}
