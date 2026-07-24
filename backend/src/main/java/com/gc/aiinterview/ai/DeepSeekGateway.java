package com.gc.aiinterview.ai;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gc.aiinterview.config.DeepSeekProperties;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class DeepSeekGateway {
    private final DeepSeekProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();

    public DeepSeekGateway(DeepSeekProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public String followUp(String originalQuestion, String answer) {
        String prompt = """
                你是一名有 8 年以上招聘经验的中国互联网公司资深技术面试官，正在进行正式模拟面试。
                你必须像真实面试官一样推进面试，而不是像老师、助手或聊天机器人。
                当前主问题：%s
                候选人刚刚的回答：%s

                请只输出下一句面试官要说的话，使用中文，控制在 20～80 字，并且只问一个问题。
                规则：
                1. 若回答正确但不完整，围绕一个具体技术点继续深挖，如原理、边界、复杂度、故障场景或实践经验。
                2. 若回答明显错误，简短指出需要澄清的方向，再提出一个更具体的问题；不要直接给出完整答案。
                3. 若候选人回答“不知道”“不清楚”或内容极少，降低一层难度，改问一个可回答的基础子问题或实际使用经验；绝不能要求候选人分析“我不知道”。
                4. 不要重复主问题、复述候选人原话，不要使用助手口吻。
                5. 不要评分、总结、鼓励、寒暄，也不要一次给出多个问题。
                """.formatted(originalQuestion, answer);
        return askText("你是专业面试官，严格执行用户给出的面试流程与输出规则。", prompt);
    }

    public String openingQuestion(String question) {
        return askText("你是一名专业的中文 AI 面试官。围绕给定题目开始正式面试。只输出一句自然、具体的首个面试问题，不要解释题目、评分、寒暄或自我介绍。", question);
    }

    public JsonNode evaluateAnswer(String question, String referenceAnswer, String candidateAnswer) {
        String prompt = """
                请对一名候选人的单题面试回答进行严格、可解释的评分。

                面试题：%s
                参考信息（可能为空，仅用于校准，不应直接泄露给候选人）：%s
                候选人回答：%s

                评分标准：
                - professionalScore：专业知识的正确性、深度和边界意识。
                - expressionScore：表达是否清晰、结构化、准确。
                - logicScore：分析过程、论据与结论的逻辑性。
                - adaptabilityScore：场景应对、实践意识和问题拆解能力。
                - overallScore：本题综合表现，不能机械地等于四项平均值。
                未作答、答非所问或“不会”应得到与实际表现相符的低分；不得因为礼貌而虚高。

                仅返回一个 JSON 对象，不要使用 Markdown 或代码块：
                {"professionalScore":0-100,"expressionScore":0-100,"logicScore":0-100,"adaptabilityScore":0-100,"overallScore":0-100,"comment":"不超过120字的具体中文评语"}
                """.formatted(question, blankToDefault(referenceAnswer, "无"), blankToDefault(candidateAnswer, "未提交任何回答"));
        return askJson("你是企业技术面试评测专家。依据证据审慎评分，输出必须是合法 JSON。", prompt);
    }

    public JsonNode generateReport(String evaluationContext) {
        String prompt = """
                根据以下一次模拟面试的逐题 AI 评测，撰写面向候选人的中文面试报告。
                只基于给出的评测证据，避免夸大或臆测。优势、待提升项和建议应具体可执行。

                逐题评测数据：%s

                仅返回一个 JSON 对象，不要使用 Markdown 或代码块：
                {"summary":"80到160字的综合结论","strengths":"2到3条优势，用换行分隔","weaknesses":"2到3条待提升项，用换行分隔","improvementSuggestions":"2到3条可执行建议，用换行分隔"}
                """.formatted(evaluationContext);
        return askJson("你是资深招聘评测顾问。根据证据生成客观、具体的候选人面试报告，输出必须是合法 JSON。", prompt);
    }

    private JsonNode askJson(String instruction, String content) {
        String reply = ask(instruction, content, true);
        try {
            String normalized = reply.trim().replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "");
            JsonNode result = objectMapper.readTree(normalized);
            if (!result.isObject()) throw new IllegalStateException("DeepSeek 返回的评测结果不是 JSON 对象");
            return result;
        } catch (IOException exception) {
            throw new IllegalStateException("DeepSeek 返回的评测结果不是合法 JSON", exception);
        }
    }

    private String askText(String instruction, String content) {
        return ask(instruction, content, false);
    }

    private String ask(String instruction, String content, boolean jsonOutput) {
        if (!properties.configured()) throw new IllegalStateException("未配置 DEEPSEEK_API_KEY 或未启用 app.deepseek.enabled");
        try {
            String payload = objectMapper.writeValueAsString(new Request(properties.model(), List.of(
                    new Message("system", instruction), new Message("user", content)),
                    jsonOutput ? new ResponseFormat("json_object") : null, jsonOutput ? 0.2 : 0.7));
            HttpRequest request = HttpRequest.newBuilder(URI.create(properties.baseUrl().replaceAll("/$", "") + "/chat/completions"))
                    .timeout(Duration.ofSeconds(90)).header("Authorization", "Bearer " + properties.apiKey()).header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload)).build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("DeepSeek API 请求失败（HTTP " + response.statusCode() + "）：" + response.body());
            }
            JsonNode result = objectMapper.readTree(response.body());
            String reply = result.path("choices").path(0).path("message").path("content").asText();
            if (reply.isBlank()) throw new IllegalStateException("DeepSeek 未返回有效内容");
            return reply;
        } catch (IOException exception) {
            throw new IllegalStateException("调用 DeepSeek API 失败", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("调用 DeepSeek API 被中断", exception);
        }
    }

    private String blankToDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record Request(String model, List<Message> messages, @JsonProperty("response_format") ResponseFormat responseFormat,
                           Double temperature) {}
    private record Message(String role, String content) {}
    private record ResponseFormat(String type) {}
}
